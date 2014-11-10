/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = {
  config: require('../config'),
  docs: require('./docs'),
  website: require('./website')
};

// constants
// TODO: change to 'bedrock.services'
var MODULE_NS = bedrock.website.namespace;

// module API
var api = {};
api.name = MODULE_NS + '.well-known';
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
 * @param app the payswarm-auth application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.get('/.well-known/web-keys', function(req, res) {
    var endpoints = {
      '@context': {
        publicKeyService: 'https://w3id.org/security#publicKeyService'
      },
      publicKeyService:
        bedrock.config.server.baseUri +
        bedrock.config.identity.basePath +
        '?service=add-key'
    };
    res.type('application/json');
    res.send(endpoints);
  });
  bedrock.docs.annotate.get('/.well-known/web-keys', {
    displayName: 'Discovery - Web Keys',
    description: 'Get the Web keys services associated with this website.',
    responses: {
      200: {
        'application/ld+json': {
          'example': 'examples/well-known.web-keys.jsonld'
        }
      }
    }
  });

  app.server.get('/.well-known/identity', function(req, res) {
    var endpoints = {
      '@context': {
        id: '@id',
        identityService: 'https://w3id.org/identity#identityService',
        owner: 'https://w3id.org/security#owner'
      },
      identityService: {
        id: bedrock.config.server.baseUri + bedrock.config.identity.basePath,
        owner: bedrock.config.identity.owner
      }
    };
    res.type('application/json');
    res.send(endpoints);
  });
  bedrock.docs.annotate.get('/.well-known/identity', {
    displayName: 'Discovery - Identity Credentials',
    description: 'Get the Identity services associated with this website.',
    responses: {
      200: {
        'application/ld+json': {
          'example': 'examples/well-known.identity.jsonld'
        }
      }
    }
  });

  callback();
}
