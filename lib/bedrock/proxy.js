/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
 var async = require('async');
var httpProxy = require('http-proxy');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};

var api = {};
module.exports = api;
api.name = 'proxy';

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
  var proxy = httpProxy.createProxyServer({});
  
  for(var i in bedrock.config.proxy.paths) {
    var proxyConfig = bedrock.config.proxy.paths[i];
    
    bedrock.logger.info('Adding proxy route ' + proxyConfig.route + ' to ' +
      proxyConfig.server);

    app.server.all(proxyConfig.route, function(req, res, next) {
      proxy.web(req, res, { target: proxyConfig.server });
    });
  }
  
  callback(null);
}
