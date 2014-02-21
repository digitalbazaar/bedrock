/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var httpProxy = require('http-proxy');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  website: require('./website')
};

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
  var proxy = httpProxy.createProxyServer({});

  // add all paths that should be proxied
  bedrock.config.proxy.paths.forEach(function(proxyConfig) {
    bedrock.logger.info('Adding proxy route ' + proxyConfig.route + ' to ' +
      proxyConfig.server);

    app.server.all(proxyConfig.route, function(req, res, next) {
      proxy.web(req, res, {target: proxyConfig.server});
    });
  });

  callback(null);
}
