/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var jsonld = require('./jsonld'); // use locally-configured jsonld
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  profile: require('./profile'),
  security: require('./security'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var BedrockError = bedrock.tools.BedrockError;
var ensureAuthenticated = bedrock.website.ensureAuthenticated;
var validate = bedrock.validation.validate;
var getDefaultViewVars = bedrock.website.getDefaultViewVars;

// constants
var MODULE_NS = bedrock.website.namespace;

// sub module API
var api = {};
module.exports = api;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    function(callback) {
      addServices(app, callback);
    }
  ], callback);
};

/**
 * Adds web services to the server.
 *
 * @param app the bedrock-auth application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  // common handler for single page app identity pages
  // displayed content handled client side
  function _handler(req, res, next) {
    getDefaultViewVars(req, function(err, vars) {
      if(err) {
        return next(err);
      }

      // get identity based on URL
      var id = bedrock.identity.createIdentityId(req.params.identity);
      bedrock.identity.getIdentity(
        req.user.profile, id, function(err, identity) {
          if(err) {
            return next(err);
          }
          vars.identity = identity;
          vars.clientData.identity = identity;
          res.render('main.tpl', vars);
        });
    });
  }

  // single page app ui urls
  app.server.get(
      bedrock.config.identity.basePath + '/:identity/dashboard',
      ensureAuthenticated, _handler);
  app.server.get(
      bedrock.config.identity.basePath + '/:identity/settings',
      ensureAuthenticated, _handler);

  app.server.post(bedrock.config.identity.basePath,
    ensureAuthenticated,
    validate('services.identity.postIdentities'),
    function(req, res, next) {
      var identity = {};
      identity.id = bedrock.identity.createIdentityId(
        req.body.psaSlug);
      identity.type = req.body.type || 'PersonalIdentity';
      identity.owner = req.user.profile.id;
      identity.psaSlug = req.body.psaSlug;
      identity.label = req.body.label;

      // only set website if provided
      if(req.body.website) {
        identity.website = req.body.website;
      }
      // only set description if provided
      if(req.body.description) {
        identity.description = req.body.description;
      }

      // add identity
      bedrock.identity.createIdentity(
        req.user.profile, identity, function(err) {
          if(err) {
            if(bedrock.db.isDuplicateError(err)) {
              err = new BedrockError(
                'The identity could not be added.',
                MODULE_NS + '.DuplicateIdentity', {
                  identity: identity.id,
                  'public': true
                });
            }
            else {
              err = new BedrockError(
                'The identity could not be added.',
                MODULE_NS + '.AddIdentityFailed', {
                  'public': true
                }, err);
            }
            return next(err);
          }
          // return identity
          res.set('Location', identity.id);
          res.json(201, identity);
        });
  });

  app.server.get(bedrock.config.identity.basePath,
    ensureAuthenticated,
    validate({query: 'services.identity.getIdentitiesQuery'}),
    function(req, res, next) {
      async.waterfall([
        function(callback) {
          bedrock.profile.getProfile(
            req.user.profile, req.user.profile.id, callback);
        },
        function(profile, profileMeta, callback) {
          // get all profile identities
          _getIdentities(req, function(err, identities) {
            callback(err, profile, profileMeta, identities);
          });
        },
        function(profile, profileMeta, identities) {
          getDefaultViewVars(req, function(err, vars) {
            if(err) {
              return callback(err);
            }
            vars.profile = profile;
            vars.profileMeta = profileMeta;
            vars.identities = identities;
            res.render('identities.tpl', vars);
          });
        }
      ], function(err) {
        if(err) {
          next(err);
        }
      });
  });

  app.server.post(bedrock.config.identity.basePath + '/:identity',
    ensureAuthenticated,
    validate('services.identity.postIdentity'),
    function(req, res, next) {
      // get ID from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);

      var identity = {};
      identity.id = identityId;
      identity.label = req.body.label;
      identity.type = req.body.type;

      // only set website if provided
      if(req.body.website) {
        identity.website = req.body.website;
      }
      // only set description if provided
      if(req.body.description) {
        identity.description = req.body.description;
      }

      // update identity
      bedrock.identity.updateIdentity(
        req.user.profile, identity, function(err) {
          if(err) {
            return next(err);
          }
          res.send(204);
        });
  });

  // authentication not required
  app.server.get(bedrock.config.identity.basePath + '/:identity',
    function(req, res, next) {
      // get ID from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);

      // FIXME: refactor this ... just put data into the identity like how
      // it is returned when application/ld+json is accepted?
      var data = {};

      // FIXME: use auto here instead
      async.waterfall([
        function(callback) {
          // get identity without permission check
          bedrock.identity.getIdentity(
            null, identityId, function(err, identity, meta) {
              if(err) {
                return callback(err);
              }

              // FIXME: this should be in the DB already
              identity['@context'] = bedrock.config.constants.CONTEXT_URL;
              data.privateIdentity = identity;

              // determine if requestor is the owner of the identity
              var isOwner = req.isAuthenticated() &&
                identity.owner === req.user.profile.id;
              if(isOwner) {
                data.identity = identity;
              }
              else {
                // only include public info
                data.publicIdentity = {
                  '@context': bedrock.config.constants.CONTEXT_URL,
                  id: identity.id,
                  type: identity.type
                };
                identity.psaPublic.forEach(function(field) {
                  data.publicIdentity[field] = identity[field];
                });
                data.identity = data.publicIdentity;
              }
              data.identityMeta = meta;
              callback();
            });
        },
        function(callback) {
          // FIXME: can be skipped if not sending html
          getDefaultViewVars(req, function(err, vars) {
            if(err) {
              return callback(err);
            }
            data.vars = vars;
            vars.identity = data.identity;
            vars.identityMeta = data.identityMeta;
            callback();
          });
        },
        function(callback) {
          // get identity's keys
          bedrock.identity.getIdentityPublicKeys(
            identityId, function(err, records) {
              callback(err, records);
            });
        },
        function(records, callback) {
          var keys = data.keys = data.vars.keys = [];
          records.forEach(function(record) {
            var key = record.publicKey;
            if(key.psaStatus === 'active') {
              keys.push(key);
            }
          });
          callback(null);
        }
      ], function(err) {
        if(err) {
          return next(err);
        }

        function ldjson() {
          // build identity w/embedded keys
          var identity = data.identity;
          for(var i = 0; i < data.keys.length; ++i) {
            var key = data.keys[i];
            delete key['@context'];
            delete key.publicKeyPem;
            delete key.psaStatus;
            jsonld.addValue(identity, 'publicKey', key);
          }
          res.json(data.identity);
        }
        res.format({
          'application/ld+json': ldjson,
          json: ldjson,
          html: function() {
            res.render('identity.tpl', data.vars);
          }
        });
        return;
      });
  });

  callback(null);
}

/**
 * Gets a Profile's Identities.
 *
 * @param req the request with the Profile.
 * @param callback(err, identities) called once the operation completes.
 */
function _getIdentities(req, callback) {
  // get all profile identities
  bedrock.identity.getProfileIdentities(
    req.user.profile, req.user.profile.id, function(err, records) {
      if(err) {
        return callback(err);
      }
      var identities = [];
      records.forEach(function(record) {
        identities.push(record.identity);
      });
      callback(null, identities);
    });
}
