/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var express = require('express');
var cors = require('cors');
var forge = require('node-forge');
var fs = require('fs');
var http = require('http');
var https = require('https');
var passport = require('passport');
var path = require('path');
var bedrock = require('../bedrock');

// module api
var api = {servers: {}};
module.exports = api;

// create express server
var server = api.app = express();

// TODO: remove these; use event system only
server.earlyHandlers = [];
server.errorHandlers = [];

// redefine logger token for remote-addr to use express-parsed ip
// (includes X-Forwarded-For header if available)
express.logger.token('remote-addr', function(req) {
  return req.ip;
});

// default jsonld mimetype
express.static.mime.define({'application/ld+json': ['jsonld']});

var sessionCfg = {};

var started = false;
bedrock.events.on('bedrock.started', function() {
  started = true;
  var logger = bedrock.loggers.get('app');
  logger.info('server url: https://' +
    bedrock.config.server.bindAddr + ':' + bedrock.config.server.port);
});

bedrock.events.on('bedrock.stop', function(callback) {
  // stop HTTP and HTTPS server
  if(api.httpServer) {
    api.httpServer.close();
  }
  if(api.httpsServer) {
    api.httpsServer.close();
  }
  callback();
});

bedrock.events.on('bedrock.modules.init', init);

function init(callback) {
  async.auto({
    init: function(callback) {
      // TODO: don't attach to 'app', just use require('bedrock-express').app
      // in other modules
      bedrock.app.server = server;
      bedrock.events.emit('bedrock-express.init', callback);
    },
    beforeLogger: ['init', function(callback) {
      // basic config
      server.enable('trust proxy');
      server.disable('x-powered-by');
      bedrock.events.emit('bedrock-express.configure.logger', callback);
    }],
    logger: ['beforeLogger', function(callback, results) {
      if(results.beforeLogger === false) {
        return callback();
      }
      var accessLogger = bedrock.loggers.get('access');
      server.use(express.logger({
        stream: {write: function(str) {accessLogger.log('info', str);}}
      }));
      callback();
    }],
    beforeBodyParser: ['logger', function(callback) {
      server.use(express.methodOverride());
      // rate limit based on IP address
      server.use(bedrock.limiter.ipRateLimit);
      bedrock.events.emit('bedrock-express.configure.bodyParser', callback);
    }],
    bodyParser: ['beforeBodyParser', function(callback, results) {
      if(results.beforeBodyParser === false) {
        return callback();
      }
      server.use(express.bodyParser());
      callback();
    }],
    beforeCookieParser: ['bodyParser', function(callback) {
      bedrock.events.emit('bedrock-express.configure.cookieParser', callback);
    }],
    cookieParser: ['bodyParser', function(callback, results) {
      if(results.bodyParser === false) {
        return callback();
      }
      server.use(express.cookieParser(
        bedrock.config.server.session.secret));
      callback();
    }],
    gatekeeper: ['cookieParser', function(callback) {
      server.use(function(req, res, next) {
        if(!started) {
          return res.send(503);
        }
        next();
      });
      callback();
    }],
    beforeSessionStore: ['gatekeeper', function(callback) {
      bedrock.events.emit('bedrock-express.configure.sessionStore', callback);
    }],
    sessionStore: ['beforeSessionStore', function(callback, results) {
      if(results.beforeSessionStore === false) {
        return callback();
      }

      // TODO: move to database module

      // configure w/o database-backed session storage
      if(bedrock.config.environment === 'down' ||
        bedrock.config.modules.indexOf('database') === -1) {
        return callback();
      }

      // configure w/database-based session storage
      var database = require('./database');
      database.createSessionStore(express, function(err, store) {
        if(err) {
          callback(err);
        }
        sessionCfg.store = store;
        callback();
      });
    }],
    beforeSession: ['sessionStore', function(callback) {
      bedrock.events.emit('bedrock-express.configure.session', callback);
    }],
    session: ['beforeSession', function(callback, results) {
      if(results.beforeSession === false) {
        return callback();
      }
      if(bedrock.config.environment !== 'down') {
        server.use(express.session(bedrock.tools.extend(
          sessionCfg, bedrock.config.server.session)));
        server.use(passport.initialize());
        server.use(passport.session());
      }
      callback();
    }],
    beforeStatic: ['session', function(callback) {
      bedrock.events.emit('bedrock-express.configure.static', callback);
    }],
    static: ['beforeStatic', function(callback, results) {
      // TODO: remove "custom early handlers" and use
      // 'bedrock-express.configure.static' event instead
      server.use(function(req, res, next) {
        var i = -1;
        (function nextHandler() {
          i += 1;
          return (i === server.earlyHandlers.length ?
            next() : server.earlyHandlers[i](req, res, nextHandler));
        })();
      });
      // compress static content
      server.use(express.compress());
      if(results.beforeStatic === false) {
        return callback();
      }
      // add each static path
      var logger = bedrock.loggers.get('app');
      for(var i = bedrock.config.server.static.length - 1; i >= 0; --i) {
        var cfg = bedrock.config.server.static[i];
        if(typeof cfg === 'string') {
          cfg = {route: '/', path: cfg};
        }
        // setup cors
        var corsHandler = null;
        if('cors' in cfg) {
          if(typeof cfg.cors === 'boolean' && cfg.cors) {
            // if boolean and true just use defaults
            corsHandler = cors();
          } else {
            // if object, use as cors config
            corsHandler = cors(cfg.cors);
          }
        }

        var p = path.resolve(cfg.path);
        if(cfg.file) {
          // serve single file
          logger.debug('serving route: "' + cfg.route +
            '" with file: "' + p + '"');
          if(corsHandler) {
            server.use(cfg.route, corsHandler);
          }
          server.use(cfg.route, _serveFile(p));
        } else {
          // serve directory
          logger.debug('serving route: "' + cfg.route +
            '" with dir: "' + p + '"');
          if(corsHandler) {
            server.use(cfg.route, corsHandler);
          }
          server.use(cfg.route, express.static(
            p, bedrock.config.server.staticOptions));
        }
      }
      callback();
    }],
    beforeCache: ['static', function(callback) {
      bedrock.events.emit('bedrock-express.configure.cache', callback);
    }],
    cache: ['beforeCache', function(callback, results) {
      if(results.beforeCache === false) {
        return callback();
      }
      // done after static to prevent caching non-static resources only
      server.use(function(req, res, next) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        next();
      });
      callback();
    }],
    beforeRouter: ['cache', function(callback) {
      bedrock.events.emit('bedrock-express.configure.router', callback);
    }],
    router: ['beforeRouter', function(callback, results) {
      if(results.beforeRouter === false) {
        return callback();
      }
      server.use(server.router);
      callback();
    }],
    beforeRoutes: ['router', function(callback) {
      bedrock.events.emit('bedrock-express.configure.routes', callback);
    }],
    routes: ['beforeRoutes', function(callback, results) {
      if(results.beforeRoutes === false) {
        return callback();
      }
      callback();
    }],
    beforeErrorHandlers: ['routes', function(callback) {
      bedrock.events.emit('bedrock-express.configure.errorHandlers', callback);
    }],
    errorHandlers: ['beforeErrorHandlers', function(callback, results) {
      if(results.beforeErrorHandlers === false) {
        return callback();
      }
      // TODO: remove "custom error handlers" and use
      // 'bedrock-express.configure.errorHandlers' event instead
      server.use(function(err, req, res, next) {
        var i = -1;
        (function nextHandler(err) {
          i += 1;
          return (i === server.errorHandlers.length ?
            next(err) : server.errorHandlers[i](err, req, res, nextHandler));
        })(err);
      });
      if(bedrock.config.environment === 'development') {
        server.use(express.errorHandler(
          {dumpExceptions: true, showStack: true}));
      } else {
        server.use(express.errorHandler());
      }
      callback();
    }],
    http: ['errorHandlers', function(callback) {
      // serve express via TLS server
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
      api.servers.https = https.createServer(httpsOptions, bedrock.app.server);
      // TODO: don't attach to 'app', expose via require('bedrock-express')
      bedrock.app.httpsServer = api.servers.https;

      // redirect plain http traffic to https
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
      api.servers.http = http.createServer(redirect);
      // TODO: don't attach to 'app', expose via require('bedrock-express')
      bedrock.app.httpServer = api.servers.http;

      // enable unlimited listeners on servers
      api.servers.https.setMaxListeners(0);
      api.servers.http.setMaxListeners(0);

      callback();
    }],
    start: ['http', function(callback) {
      bedrock.events.emit('bedrock-express.start', callback);
    }],
    listenHttps: ['start', function(callback, results) {
      if(results.start === false) {
        return callback();
      }
      var logger = bedrock.loggers.get('app');
      var port = bedrock.config.server.port;
      async.forEach(bedrock.config.server.bindAddr, function(addr, next) {
        logger.debug('starting HTTPS server on %s:%d', addr, port);
        api.servers.https.on('error', function(err) {throw err;});
        bedrock.events.emit(
          'bedrock-express.https.listen', {address: addr, port: port});
        api.servers.https.listen(port, addr, function() {
          bedrock.events.emit(
            'bedrock-express.https.listening',
            {address: addr, port: port});
          next();
        });
      }, callback);
    }],
    listenHttp: ['start', function(callback, results) {
      if(results.start === false) {
        return callback();
      }
      var logger = bedrock.loggers.get('app');
      var port = bedrock.config.server.httpPort;
      async.forEach(bedrock.config.server.bindAddr, function(addr, next) {
        logger.debug('starting HTTP server on %s:%d', addr, port);
        api.servers.http.on('error', function(err) {throw err;});
        api.servers.http.listen(port, addr, function() {next();});
      }, callback);
    }],
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
      bedrock.events.emit('bedrock-express.ready', callback);
    }]
  }, function(err) {
    callback(err);
  });
}

// creates middleware for serving a single static file
function _serveFile(file) {
  return function(req, res) {
    res.sendfile(file, bedrock.config.server.staticOptions);
  };
}
