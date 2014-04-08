/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var cors = require('cors');
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
        req.user.identity, publicKey, privateKey, function(err) {
          if(err) {
            if(bedrock.db.isDuplicateError(err)) {
              err = new BedrockError(
                'The identity key is a duplicate and could not be added.',
                MODULE_NS + '.DuplicateIdentityKey', {
                  httpStatusCode: 409,
                  'public': true
                });
            }
            else {
              err = new BedrockError(
              'The identity key could not be added.',
              MODULE_NS + '.AddIdentityKeyFailed', {
                httpStatusCode: 400,
                'public': true
              }, err);
            }
            return next(err);
          }
          // return key
          res.set('Location', publicKey.id);
          res.json(201, publicKey);
        });
  });

  app.server.get(idPath + '/keys',
    cors(),
    bedrock.website.makeResourceHandler({
      get: function(req, res, callback) {
        var identityId = bedrock.identity.createIdentityId(req.params.identity);

        // get keys
        bedrock.identity.getIdentityPublicKeys(
          identityId, function(err, records) {
            if(err) {
              callback(err);
            }
            callback(null, _.pluck(records, 'publicKey'));
          });
      }
    }));

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
          req.user.identity, publicKeyId, function(err, key) {
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
            req.user.identity, key, callback);
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  app.server.get(idPath + '/keys/:publicKey',
    cors(),
    bedrock.website.makeResourceHandler({
      get: function(req, res, callback) {
        var identityId =
          bedrock.identity.createIdentityId(req.params.identity);
        var publicKeyId = bedrock.identity.createIdentityPublicKeyId(
          identityId, req.params.publicKey);

        // get public key
        bedrock.identity.getIdentityPublicKey(
          {id: publicKeyId}, function(err, key) {
            if(err) {
              callback(err);
            }
            callback(null, key);
          });
      },
      errorMap: {
        'bedrock.identity.PublicKeyNotFound': 'bedrock.website.NotFound'
      },
      template: 'key.html',
      templateNeedsResource: true,
      updateVars: function(resource, vars, callback) {
        vars.key = resource;
        vars.clientData.key = resource;
        callback();
      }
    }));

  callback(null);
}
