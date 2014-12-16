/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
// TODO: just require('bedrock')
var bedrock = {
  config: require('../config'), // bedrock-config
  events: require('./events'), // bedrock-events
  loggers: require('./loggers'), // bedrock-loggers
  server: require('./bedrock-server'),
  tools: require('./tools') // bedrock-tools
};
var express = require('express');
var cors = require('cors');
var passport = require('passport');
var path = require('path');

// module api
var api = {servers: {}};
module.exports = api;

// modify express to allow multiple view roots
_allowMultipleViewRoots();

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
  bedrock.server.servers.https.on('request', api.app);
});

bedrock.events.on('bedrock.modules.init', init);

function init(callback) {
  async.auto({
    init: function(callback) {
      bedrock.events.emit('bedrock-express.init', server, callback);
    },
    beforeLogger: ['init', function(callback) {
      // basic config
      server.enable('trust proxy');
      server.disable('x-powered-by');
      bedrock.events.emit('bedrock-express.configure.logger', server, callback);
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
      bedrock.events.emit(
        'bedrock-express.configure.bodyParser', server, callback);
    }],
    bodyParser: ['beforeBodyParser', function(callback, results) {
      if(results.beforeBodyParser === false) {
        return callback();
      }
      server.use(express.bodyParser());
      callback();
    }],
    beforeCookieParser: ['bodyParser', function(callback) {
      bedrock.events.emit(
        'bedrock-express.configure.cookieParser', server, callback);
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
      bedrock.events.emit(
        'bedrock-express.configure.sessionStore', server, callback);
    }],
    sessionStore: ['beforeSessionStore', function(callback, results) {
      if(results.beforeSessionStore === false) {
        return callback();
      }

      // TODO: move to bedrock-express-session module, listen for
      // bedrock-express.configure.sessionStore event

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
      bedrock.events.emit(
        'bedrock-express.configure.session', server, callback);
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
      bedrock.events.emit('bedrock-express.configure.static', server, callback);
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
      bedrock.events.emit('bedrock-express.configure.cache', server, callback);
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
      bedrock.events.emit('bedrock-express.configure.router', server, callback);
    }],
    router: ['beforeRouter', function(callback, results) {
      if(results.beforeRouter === false) {
        return callback();
      }
      server.use(server.router);
      callback();
    }],
    beforeRoutes: ['router', function(callback) {
      bedrock.events.emit('bedrock-express.configure.routes', server, callback);
    }],
    routes: ['beforeRoutes', function(callback, results) {
      if(results.beforeRoutes === false) {
        return callback();
      }
      callback();
    }],
    beforeErrorHandlers: ['routes', function(callback) {
      bedrock.events.emit(
        'bedrock-express.configure.errorHandlers', server, callback);
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
      bedrock.events.emit('bedrock-express.start', server, callback);
    }],
    start: ['beforeStart', function(callback) {
      // allows modules to attach to bedrock-express start event before ready
      callback();
    }],
    ready: ['start', function(callback) {
      bedrock.events.emit('bedrock-express.ready', server, callback);
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

// allows multiple view root paths to be used
function _allowMultipleViewRoots() {
  var View = require('express/lib/view');
  var old = View.prototype.lookup;
  View.prototype.lookup = function(path) {
    var self = this;
    var root = self.root;
    // if root is an array, try each root in reverse order until path exists
    if(Array.isArray(root)) {
      var foundPath;
      for(var i = root.length - 1; i >= 0; --i) {
        self.root = root[i];
        foundPath = old.call(self, path);
        if(foundPath) {
          break;
       }
      }
      self.root = root;
      return foundPath;
    }
    // fallback to standard behavior, when root is a single directory
    return old.call(self, path);
  };
}
