/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var express = require('express');
var cors = require('cors');
var passport = require('passport');
var path = require('path');
var bedrock = require('../bedrock');
var bedrockServer = require('./bedrock-server');

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

// track when bedrock has started to attach express
bedrock.events.on('bedrock.started', function() {
  // attach express to TLS
  bedrockServer.servers.https.on('request', api.app);
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
    beforeSessionStore: ['cookieParser', function(callback) {
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
    beforeStart: ['errorHandlers', function(callback) {
      bedrock.events.emit('bedrock-express.start', callback);
    }],
    start: ['beforeStart', function(callback, results) {
      // allows modules to attach to bedrock-express start event before ready
      callback();
    }],
    ready: ['start', function(callback) {
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
