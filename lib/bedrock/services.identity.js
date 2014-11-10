/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  docs: require('./docs'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  security: require('./security'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var cors = require('cors');
var jsonld = require('./jsonld'); // use locally-configured jsonld
var url = require('url');
var util = require('util');

var BedrockError = bedrock.tools.BedrockError;
var ensureAuthenticated = bedrock.website.ensureAuthenticated;
var validate = bedrock.validation.validate;
var getDefaultViewVars = bedrock.website.getDefaultViewVars;

// constants
// TODO: change to 'bedrock.services'
var MODULE_NS = bedrock.website.namespace;

// module API
var api = {};
api.name = MODULE_NS + '.identity';
api.namespace = MODULE_NS;
module.exports = api;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  addServices(app, callback);
};

/**
 * Adds web services to the server.
 *
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  var idPath = bedrock.config.identity.basePath + '/:identity';

  // single page app ui urls
  app.server.get(idPath + '/dashboard',
      ensureAuthenticated,
      bedrock.website.makeResourceHandler());
  app.server.get(idPath + '/settings',
      ensureAuthenticated,
      bedrock.website.makeResourceHandler());

  app.server.post(bedrock.config.identity.basePath,
    ensureAuthenticated,
    validate({query: 'services.identity.postIdentitiesQuery'}),
    validate('services.identity.postIdentities'),
    function(req, res, next) {
      // do identity credentials query
      if(req.query.action === 'query') {
        return _getCredentials(req, res, next);
      }

      // do create identity
      var identity = {};
      identity['@context'] = bedrock.config.constants.CONTEXT_URL;
      identity.id = bedrock.identity.createIdentityId(req.body.sysSlug);
      identity.type = req.body.type || 'Identity';
      identity.sysSlug = req.body.sysSlug;
      identity.label = req.body.label;

      // conditional values only set if present
      if(req.body.description) {
        identity.description = req.body.description;
      }
      if(req.body.image) {
        identity.image = req.body.image;
      }
      if(req.body.sysGravatarType) {
        identity.sysGravatarType = req.body.sysGravatarType;
      }
      if(req.body.sysImageType) {
        identity.sysImageType = req.body.sysImageType;
      }
      if(req.body.sysPublic) {
        identity.sysPublic = req.body.sysPublic;
      }
      if(req.body.url) {
        identity.url = req.body.url;
      }

      // add identity
      bedrock.identity.createIdentity(
        req.user.identity, identity, function(err) {
          if(err) {
            if(bedrock.db.isDuplicateError(err)) {
              return next(new BedrockError(
                'The identity is a duplicate and could not be added.',
                MODULE_NS + '.DuplicateIdentity', {
                  identity: identity.id,
                  httpStatusCode: 409,
                  'public': true
                }));
            }
            return next(new BedrockError(
              'The identity could not be added.',
              MODULE_NS + '.AddIdentityFailed', {
                httpStatusCode: 400,
                'public': true
              }, err));
          }
          // return identity
          res.set('Location', identity.id);
          res.json(201, identity);
        });
  });
  bedrock.docs.annotate.post(bedrock.config.identity.basePath, {
    displayName: 'Managing Identity',
    description: 'Create a new identity on the system.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.identity.postIdentities',
    querySchema: 'services.identity.postIdentitiesQuery',
    responses: {
      201: 'Identity creation was successful. The Location header will ' +
        'contain the URL identifier for the identity.',
      400: 'The identity was rejected. ' +
        'Error details will be included in the response body.',
      409: 'The identity was rejected because it is a duplicate.'
    }
  });

  app.server.get(bedrock.config.identity.basePath,
    ensureAuthenticated,
    validate({query: 'services.identity.getIdentitiesQuery'}),
    function(req, res, next) {
      if(req.query.service === 'add-key') {
        // logged in at this point, redirect to keys page and preserve query
        var urlObj = url.parse(req.originalUrl);
        urlObj.pathname = util.format(
          '%s/%s/keys',
          urlObj.pathname,
          req.user.identity.sysSlug);
        var redirUrl = url.format(urlObj);
        res.redirect(307, redirUrl);
        return;
      }

      res.send(404);
      /*
      // TODO: get identities that current identity is a memberOf? (orgs?)

      // FIXME: use .auto instead?
      async.waterfall([
        function(callback) {
          bedrock.identity.getIdentity(
            req.user.identity, req.user.identity.id, callback);
        },
        function(identity, identityMeta, callback) {
          // get all related identities
          _getIdentities(req, function(err, identities) {
            callback(err, identity, identityMeta, identities);
          });
        },
        function(identity, identityMeta, identities) {
          getDefaultViewVars(req, function(err, vars) {
            if(err) {
              return callback(err);
            }
            vars.identity = identity;
            vars.identityMeta = identityMeta;
            vars.identities = identities;
            res.render('main.html', vars);
          });
        }
      ], function(err) {
        if(err) {
          next(err);
        }
      });
      */
  });
  bedrock.docs.annotate.get(bedrock.config.identity.basePath, {
    description: 'Discover the endpoint of a particular identity service. ' +
      'This method is typically used by a 3rd party website that wants to ' +
      'perform operations on an unknown identity, like adding a public key, ' +
      'but does not know the exact service URL for the operation.' +
      'Valid actions include \'query\', and valid services include ' +
      '\'add-key\'.',
    securedBy: ['cookie', 'hs1'],
    querySchema: 'services.identity.getIdentitiesQuery',
    responses: {
      307: 'A redirect to the location of the actual service.',
      404: 'The request did not result in an action.'
    }
  });

  app.server.post(idPath,
    ensureAuthenticated,
    validate('services.identity.postIdentity'),
    function(req, res, next) {
      // get ID from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);

      var identity = {};

      // check id matches
      if(req.body.id !== identityId) {
        return next(new BedrockError(
          'Identity mismatch.',
          MODULE_NS + '.IdentityMismatch', {
            identity: identityId,
            httpStatusCode: 400,
            'public': true
          }));
      }
      identity.id = identityId;

      // conditional values only set if preset
      if(req.body.description) {
        identity.description = req.body.description;
      }
      if(req.body.image) {
        identity.image = req.body.image;
      }
      if(req.body.label) {
        identity.label = req.body.label;
      }
      if(req.body.sysGravatarType) {
        identity.sysGravatarType = req.body.sysGravatarType;
      }
      if(req.body.sysImageType) {
        identity.sysImageType = req.body.sysImageType;
      }
      if(req.body.sysPublic) {
        identity.sysPublic = req.body.sysPublic;
      }
      if(req.body.sysSigningKey) {
        identity.sysSigningKey = req.body.sysSigningKey;
      }
      if(req.body.url) {
        identity.url = req.body.url;
      }

      // FIXME: allow changes to identity type?
      /*
      //identity.type = req.body.type;
      */

      // update identity
      bedrock.identity.updateIdentity(
        req.user.identity, identity, function(err) {
          if(err) {
            return next(err);
          }
          res.send(204);
        });
  });
  bedrock.docs.annotate.post(idPath, {
    description: 'Update an existing identity on the system.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.identity.postIdentity',
    responses: {
      204: 'The identity was updates successfully.',
      400: 'The provided identity did not match any in the database.'
    }
  });

  // authentication not required
  app.server.options(idPath, cors());
  app.server.get(idPath, cors(), function(req, res, next) {
    // get ID from URL
    var identityId = bedrock.identity.createIdentityId(req.params.identity);

    // FIXME: refactor this ... just put data into the identity like how
    // it is returned when application/ld+json is accepted?
    var data = {};

    // FIXME: use auto here instead
    async.waterfall([
      function(callback) {
        // get identity without permission check
        bedrock.identity.getIdentity(null, identityId, function(
          err, identity, meta) {
          if(err) {
            return callback(err);
          }

          data.privateIdentity = identity;

          // determine if requestor is the identity
          var isIdentity = req.isAuthenticated() &&
            identity.id === req.user.identity.id;
          if(isIdentity) {
            data.identity = identity;
          } else {
            // only include public info
            data.publicIdentity = {
              '@context': bedrock.config.constants.CONTEXT_URL,
              id: identity.id,
              type: identity.type
            };
            identity.sysPublic.forEach(function(field) {
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
          if(key.sysStatus === 'active') {
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
          delete key.sysStatus;
          jsonld.addValue(identity, 'publicKey', key);
        }
        res.json(identity);
      }
      res.format({
        'application/ld+json': ldjson,
        json: ldjson,
        html: function() {
          res.render('identity.html', data.vars);
        }
      });
      return;
    });
  });
  bedrock.docs.annotate.get(idPath, {
    description: 'Retrieve an existing identity on the system.',
    securedBy: ['null', 'cookie', 'hs1'],
    responses: {
      200: {
        'application/ld+json': {
          example: 'examples/get.identity.jsonld'
        }
      },
      404: 'The identity was not found on the system.'
    }
  });

  app.server.post(idPath + '/email/verify',
    ensureAuthenticated,
    validate('services.identity.postEmailVerify'),
    function(req, res, next) {
      // get ID from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);
      var identity = {
        id: identityId,
        sysPasscode: req.body.sysPasscode
      };
      bedrock.identity.verifyIdentityEmail(
        req.user.identity, identity, function(err, verified) {
        if(err) {
          return next(err);
        }
        if(!verified) {
          return next(new BedrockError(
            'Email verification failed.',
            MODULE_NS + '.EmailVerificationFailed', {
              identity: identityId,
              httpStatusCode: 403,
              'public': true
            }));
        }
        res.send(204);
      });
  });
  bedrock.docs.annotate.post(idPath + '/email/verify', {
    description: 'Perform an email verification.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.identity.postEmailVerify',
    responses: {
      204: 'The email was verified successfully.',
      403: 'The provided email verification code was invalid.'
    }
  });

  callback(null);
}

/**
 * Gets the credentials for the identity specified in the request query.
 *
 * @param req the request.
 * @param res the response.
 * @param next the next route handler.
 */
function _getCredentials(req, res, next) {
  // TODO: support no callback case
  // if present, callback must start with 'https://'
  if(!req.query.callback ||
    (!bedrock.config.identityCredentials.allowInsecureCallback &&
    req.query.callback.indexOf('https://') !== 0)) {
    return next(new BedrockError(
      'The Identity credentials callback must be an absolute URL that uses ' +
      'the HTTPS protocol.',
      MODULE_NS + '.InvalidCallback', {
        callback: req.query.callback,
        httpStatusCode: 400,
        'public': true
      }));
  }

  bedrock.website.makeResourceHandler({
    get: function(req, res, callback) {
      // parse and validate query
      var query;
      try {
        query = JSON.parse(req.body.query);
      } catch(e) {}
      validate('identityCredentialsQuery', query, function(err) {
        if(err) {
          return callback(err);
        }
        if(req.query.authorize === 'true') {
          // TODO: actually process query to create identity response
          var identity = {'@context': 'https://w3id.org/identity/v1'};
          if('id' in query) {
            identity.id = req.user.identity.id;
          }

          // sign identity as identity service
          return bedrock.identity.signJsonLdAsIdentityService(identity, {
            domain: req.query.domain
          }, function(err, signedIdentity) {
            // use identity as resource
            callback(err, signedIdentity);
          });
        }
        // use query as resource
        callback(null, query);
      });
    },
    templateNeedsResource: true,
    updateVars: function(resource, vars, callback) {
      vars.clientData.identityCredentials = {
        query: resource,
        domain: req.query.domain,
        callback: req.query.callback
      };
      callback();
    }
  })(req, res, next);
}
