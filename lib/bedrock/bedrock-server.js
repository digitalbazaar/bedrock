/*
 * Bedrock server module.
 *
 * This module binds to configured HTTP and HTTPS addresses and ports. It
 * installs an to-HTTPS redirect request listener on the HTTP server and
 * a service unavailable request listener on the HTTPS server. If a new
 * HTTP request listener is attached, the redirect listener is removed. If
 * a new HTTPS request listener is attached, the service unavailable listener
 * is removed.
 *
 * Once the ports are bound, the process is switched to any configured
 * system user.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var express = require('express');
var forge = require('node-forge');
var fs = require('fs');
var http = require('http');
var https = require('https');
var bedrock = {
  config: require('../config'), // bedrock-config
  events: require('./events'), // bedrock-events
  loggers: require('./loggers') // bedrock-loggers
};

// module api
var api = {servers: {}};
module.exports = api;

// TLS server
var httpsOptions = {
  // FIXME: remove once node 10.33+ is released
  // see: https://github.com/joyent/node/pull/8551
  // disallow SSLv3 (POODLE)
  secureOptions: require('constants').SSL_OP_NO_SSLv3,
  key: fs.readFileSync(bedrock.config.server.key),
  cert: fs.readFileSync(bedrock.config.server.cert)
};
var caFiles = bedrock.config.server.ca;
if(typeof caFiles === 'string' ||
  (Array.isArray(caFiles) && caFiles.length > 0)) {
  if(!Array.isArray(caFiles)) {
    caFiles = [caFiles];
  }
  // all certs must be parsed individually
  httpsOptions.ca = [];
  caFiles.forEach(function(file) {
    var bundle = fs.readFileSync(file);
    try {
      var certs = forge.pem.decode(bundle);
      bundle = certs.map(function(cert) {
        return forge.pem.encode(cert);
      });
    } catch(e) {
      throw new Error(e.message);
    }
    httpsOptions.ca.push.apply(httpsOptions.ca, bundle);
  });
}
api.servers.https = https.createServer(httpsOptions);
api.servers.https.setMaxListeners(0);
api.servers.https.on('error', function(err) {throw err;});

// send service unavailable until another listener is added
var unavailable = express();
unavailable.enable('trust proxy');
unavailable.disable('x-powered-by');
unavailable.use(express.logger({
  stream: {write: function(str) {accessLogger.log('info', str);}}
}));
unavailable.use(function(req, res) {
  return res.send(503);
});
api.servers.https.on('request', unavailable);
api.servers.https.on('newListener', function removeGatekeeper(event) {
  if(event === 'request') {
    api.servers.https.removeListener('request', unavailable);
    api.servers.https.removeListener('newListener', removeGatekeeper);
  }
});

// HTTP server
api.servers.http = http.createServer();
api.servers.http.setMaxListeners(0);
api.servers.http.on('error', function(err) {throw err;});

// redirect plain http traffic to https until another listener is attached
var accessLogger = bedrock.loggers.get('access');
var redirect = express();
redirect.enable('trust proxy');
redirect.use(express.logger({
  format: '(http) ' + express.logger['default'],
  stream: {write: function(str) {accessLogger.log('info', str);}}
}));
redirect.get('*', function(req, res) {
  res.redirect('https://' + bedrock.config.server.host + req.url);
});
api.servers.http.on('request', redirect);
api.servers.http.on('newListener', function removeRedirect(event) {
  if(event === 'listener') {
    api.servers.http.removeListener('request', redirect);
    api.servers.http.removeListener('newListener', removeRedirect);
  }
});

// log server URL
bedrock.events.on('bedrock.started', function() {
  var logger = bedrock.loggers.get('app');
  logger.info('server url: https://' +
    bedrock.config.server.bindAddr + ':' + bedrock.config.server.port);
});

// stop servers when bedrock stops
bedrock.events.on('bedrock.stop', function(callback) {
  if(api.servers.http) {
    api.servers.http.close();
  }
  if(api.servers.https) {
    api.servers.https.close();
  }
  callback();
});

bedrock.events.on('bedrock.modules.init', init);

function init(callback) {
  async.auto({
    init: function(callback) {
      bedrock.events.emit('bedrock-server.init', callback);
    },
    listen: ['init', listen]
  }, function(err) {
    callback(err);
  });
}

/**
 * Start listening on the configured ports.
 *
 * @param callback(err) called once the operation completes.
 */
function listen(callback) {
  async.auto({
    listenHttps: function(callback) {
      var logger = bedrock.loggers.get('app');
      var port = bedrock.config.server.port;
      async.forEach(bedrock.config.server.bindAddr, function(addr, next) {
        logger.debug('starting HTTPS server on %s:%d', addr, port);
        bedrock.events.emit(
          'bedrock-server.https.listen', {address: addr, port: port});
        api.servers.https.listen(port, addr, function() {
          bedrock.events.emit(
            'bedrock-server.https.listening',
            {address: addr, port: port});
          next();
        });
      }, callback);
    },
    listenHttp: function(callback) {
      var logger = bedrock.loggers.get('app');
      var port = bedrock.config.server.httpPort;
      async.forEach(bedrock.config.server.bindAddr, function(addr, next) {
        logger.debug('starting HTTP server on %s:%d', addr, port);
        api.servers.http.listen(port, addr, function() {next();});
      }, callback);
    },
    ready: ['listenHttps', 'listenHttp', function(callback) {
      // TODO: cleaner abstraction w/bedrock core needed here
      // switch user
      if(bedrock.config.environment !== 'development') {
        process.setgid(bedrock.config.app.user.groupId);
        process.setuid(bedrock.config.app.user.userId);
      }
      // send ready message to master
      process.send({type: 'ready'});

      var logger = bedrock.loggers.get('app');
      logger.info('started server on port ' + bedrock.config.server.port);
      bedrock.events.emit('bedrock-server.ready', callback);
    }]
  }, function(err) {
    callback(err);
  });
}
