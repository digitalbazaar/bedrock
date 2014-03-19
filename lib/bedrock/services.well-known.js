/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = {
  config: require('../config')
};

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
 * @param app the payswarm-auth application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.get('/.well-known/web-keys', function(req, res) {
    var endpoints = {
      '@context': {
        publicKeyService: 'https://w3id.org/security#publicKeyService'
      },
      publicKeyService: 'https://' + bedrock.config.server.host +
        '/i?service=add-key'
    };
    res.type('application/json');
    res.send(endpoints);
  });

  callback();
}
