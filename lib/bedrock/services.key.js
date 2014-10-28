/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  docs: require('./docs'),
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
              return next(new BedrockError(
                'The identity key is a duplicate and could not be added.',
                MODULE_NS + '.DuplicateIdentityKey', {
                  httpStatusCode: 409,
                  'public': true
                }));
            }
            return next(new BedrockError(
              'The identity key could not be added.',
              MODULE_NS + '.AddIdentityKeyFailed', {
                httpStatusCode: 400,
                'public': true
              }, err));
          }
          // return key
          res.set('Location', publicKey.id);
          res.json(201, publicKey);
        });
  });
  bedrock.docs.annotate.post(idPath + '/keys', {
    description: 'Associate a public key with the identity.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.key.postKeys',
    responses: {
      201: 'Key registration was successful.',
      400: 'The key could not be added.',
      409: 'The key is a duplicate and was not added.'
    }
  });

  app.server.options(idPath + '/keys', cors());
  app.server.get(idPath + '/keys',
    cors(),
    bedrock.website.makeResourceHandler({
      get: function(req, res, callback) {
        var identityId = bedrock.identity.createIdentityId(req.params.identity);

        // get keys
        bedrock.identity.getIdentityPublicKeys(
          identityId, function(err, records) {
            if(err) {
              return callback(err);
            }
            callback(null, _.pluck(records, 'publicKey'));
          });
      }
  }));
  bedrock.docs.annotate.get(idPath + '/keys', {
    description: 'Get the list of public keys associated with an identity.',
    securedBy: ['null', 'cookie', 'hs1'],
    responses: {
      200: {
        'application/ld+json': {
          'example': 'examples/get.identity.keys.jsonld'
        }
      }
    }
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
  bedrock.docs.annotate.post(idPath + '/keys/:publicKey', {
    description: 'Modify an existing public key.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.key.postKey',
    responses: {
      200: 'The key was revoked successfully.',
      204: 'The key was updated successfully.',
      400: 'The key could not be modified.'
    }
  });

  app.server.options(idPath + '/keys/:publicKey', cors());
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
            callback(err, key);
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
  bedrock.docs.annotate.get(idPath + '/keys/:publicKey', {
    description: 'Get a public keys associated with an identity.',
    securedBy: ['null', 'cookie', 'hs1'],
    responses: {
      200: {
        'application/ld+json': {
          'example': 'examples/get.identity.keys.publicKey.jsonld'
        }
      }
    }
  });

  callback(null);
}
