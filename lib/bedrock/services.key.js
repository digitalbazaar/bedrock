/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  profile: require('./profile'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var BedrockError = bedrock.tools.BedrockError;
var ensureAuthenticated = bedrock.website.ensureAuthenticated;
var validate = bedrock.validation.validate;

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
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  var idPath = bedrock.config.identity.basePath + '/:identity';

  app.server.post(idPath + '/keys',
    ensureAuthenticated,
    validate('services.key.postKeys'),
    function(req, res, next) {
      // get ID from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);

      // build public key
      var publicKey = {
        '@context': bedrock.config.constants.CONTEXT_URL,
        type: 'CryptographicKey',
        owner: identityId,
        label: req.body.label,
        publicKeyPem: req.body.publicKeyPem
      };

      var privateKey = null;
      if('privateKeyPem' in req.body) {
        privateKey = {
          type: 'CryptographicKey',
          owner: identityId,
          label: req.body.label,
          privateKeyPem: req.body.privateKeyPem
        };
      }

      // add public key
      bedrock.identity.addIdentityPublicKey(
        req.user.profile, publicKey, privateKey, function(err) {
          if(err) {
            return next(new BedrockError(
              'The identity key could not be added.',
              MODULE_NS + '.AddIdentityKeyFailed', {
                'public': true
              }, err));
          }
          // return key
          res.set('Location', publicKey.id);
          res.json(201, publicKey);
        });
  });

  app.server.get(idPath + '/keys',
    function(req, res, next) {
      // get ID from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);
      async.waterfall([
        function(callback) {
          // get keys
          bedrock.identity.getIdentityPublicKeys(
            identityId, function(err, records) {
              if(err) {
                return callback(err);
              }
              var keys = [];
              records.forEach(function(record) {
                keys.push(record.publicKey);
              });
              res.json(keys);
            });
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
      });
  });

  app.server.post(idPath + '/keys/:publicKey',
    ensureAuthenticated,
    validate('services.key.postKey'),
    function(req, res, next) {
      // get IDs from URL
      var identityId = bedrock.identity.createIdentityId(req.params.identity);
      var publicKeyId = bedrock.identity.createIdentityPublicKeyId(
        identityId, req.params.publicKey);

      if(publicKeyId !== req.body.id) {
        // id mismatch
        return next(new BedrockError(
          'Incorrect key id.',
          MODULE_NS + '.KeyIdError', {
            'public': true,
            httpStatusCode: 400
          }));
      }

      if('revoked' in req.body) {
        // revoke public key
        return bedrock.identity.revokeIdentityPublicKey(
          req.user.profile, publicKeyId, function(err, key) {
            if(err) {
              return next(err);
            }
            res.send(200, key);
          });
      }

      async.waterfall([
        function(callback) {
          // get public key
          bedrock.identity.getIdentityPublicKey(
            {id: publicKeyId},
            function(err, publicKey) {
              callback(err, publicKey);
            });
        },
        function(key, callback) {
          // update public key
          if('label' in req.body) {
            key.label = req.body.label;
          }
          bedrock.identity.updateIdentityPublicKey(
            req.user.profile, key, callback);
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  app.server.get(idPath + '/keys/:publicKey', function(req, res, next) {
    // get IDs from URL
    var identityId = bedrock.identity.createIdentityId(req.params.identity);
    var publicKeyId = bedrock.identity.createIdentityPublicKeyId(
      identityId, req.params.publicKey);

    // get public key
    bedrock.identity.getIdentityPublicKey(
      {id: publicKeyId}, function(err, key) {
        if(err) {
          if(err.name === 'bedrock.identity.PublicKeyNotFound') {
            return next();
          }
          return next(err);
        }

        var jsonLdOutput = function() {
          res.json(key);
        };
        res.format({
          'application/ld+json': jsonLdOutput,
          json: jsonLdOutput,
          html: function() {
            bedrock.website.getDefaultViewVars(req, function(err, vars) {
              if(err) {
                return next(err);
              }
              vars.key = key;
              vars.clientData.key = key;
              res.render('key.tpl', vars);
            });
          }
        });
      });
  });

  callback(null);
}
