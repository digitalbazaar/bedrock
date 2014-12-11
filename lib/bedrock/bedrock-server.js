/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var forge = require('node-forge');
var fs = require('fs');
var http = require('http');
var https = require('https');
var bedrock = require('../bedrock');

// module api
var api = {servers: {}};
module.exports = api;

/**
 * Start listening on the configured ports.
 *
 * @param callback(err) called once the operation completes.
 */
api.listen = function(callback) {
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
};

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
api.servers.https.on('error', function(err) {throw err;});

// HTTP server
api.servers.http = http.createServer();
api.servers.http.on('error', function(err) {throw err;});

// enable unlimited listeners on servers
api.servers.https.setMaxListeners(0);
api.servers.http.setMaxListeners(0);

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

// emit server init
bedrock.events.on('bedrock.modules.init', function(callback) {
  // TODO: don't attach to 'app', just use require('bedrock-server')
  // in other modules
  bedrock.app.httpServer = api.servers.http;
  bedrock.app.httpsServer = api.servers.https;
  bedrock.events.emit('bedrock-server.init', callback);
});
