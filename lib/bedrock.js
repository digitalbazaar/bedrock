/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var cluster = require('cluster');
var events = require(__dirname + '/bedrock/events');
var express = require('express');
var forge = require('node-forge');
var fs = require('fs');
var http = require('http');
var https = require('https');
var jsonld = require(__dirname + '/bedrock/jsonld');
var path = require('path');
var limiter = require(__dirname + '/bedrock/limiter');
var passport = require('passport');
var config = require('./config');
var program = require('commander');
var loggers = require(__dirname + '/bedrock/loggers');
var security = require(__dirname + '/bedrock/security');
var swig = require('swig');
var tools = require(__dirname + '/bedrock/tools');
var validation = require(__dirname + '/bedrock/validation');
var pkginfo = require('pkginfo');

var api = {};
api.config = config;
api.events = events;
api.jsonld = jsonld;
api.limiter = limiter;
api.loggers = loggers;
api.security = security;
api.tools = tools;
api.validation = validation;
api.modules = {};
module.exports = api;
// read package.json fields
pkginfo(module, 'version');

// starts the bedrock server
api.start = function() {
  var startTime = Date.now();
  program
    .version(api.version)
    .option('--log-level <level>', 'The console log level to use.')
    .option('--silent', 'Show no console output.')
    .option('--workers <num>',
      'The number of workers to use (0: # of cpus).', Number)
    .parse(process.argv);

  // set console log level
  if(program.logLevel) {
    config.loggers.console.level = program.logLevel;
  }
  if(program.silent || program.logLevel === 'none') {
    config.loggers.console.silent = true;
  }
  if('workers' in program) {
    config.server.workers = program.workers;
  }
  if(config.server.workers <= 0) {
    config.server.workers = require('os').cpus().length;
  }

  // set no limit on event listeners
  process.setMaxListeners(0);

  // exit on terminate
  process.on('SIGTERM', function() {
    process.exit();
  });

  if(cluster.isMaster) {
    // set group to adm before initializing loggers
    if(config.environment !== 'development' &&
      config.environment !== 'testing') {
      try {
        process.setgid('adm');
      }
      catch(ex) {
        console.log('Failed to set gid: ' + ex);
      }
    }
  }

  // initialize logging system
  loggers.init(function(err) {
    if(err) {
      // can't log, quit
      console.log('Error: ' + err);
      process.exit(1);
    }

    var logger = loggers.get('app');

    if(cluster.isMaster) {
      // set 'ps' title
      var args = process.argv.slice(2).join(' ');
      process.title = config.app.masterTitle + (args ? (' ' + args) : '');

      // log uncaught exception and exit unless in test mode
      if(process.env.NODE_ENV !== 'test') {
        process.on('uncaughtException', function(err) {
          logger.critical('uncaught error: ' + err, err);
          process.removeAllListeners('uncaughtException');
          process.exit(1);
        });
      }

      logger.info('running bedrock master process...', {pid: process.pid});

      async.waterfall([
        function(callback) {
          if(config.environment !== 'down' &&
            config.modules.indexOf('database') !== -1) {
            // initialize database
            var database = require(__dirname + '/bedrock/database');
            database.initDatabase(callback);
          } else {
            callback();
          }
        },
        function(callback) {
          // keep track of master state
          var masterState = {
            switchedUser: false
          };

          // notify workers to exit if master exits
          process.on('exit', function() {
            for(var id in cluster.workers) {
              cluster.workers[id].send({type: 'app', message: 'exit'});
            }
          });

          // if test mode, exit when the worker exits
          if(process.env.NODE_ENV === 'test') {
            cluster.on('exit', function(worker, code) {
              logger.error(
                'Test worker ' + worker.process.pid +
                ' died (' + code + '). Exiting.');
              process.exit(code);
            });
          }

          // handle worker exit
          cluster.on('exit', function(worker) {
            logger.critical('worker ' + worker.process.pid + ' exited');

            // fork a new worker if a worker exits
            if(config.app.restartWorkers) {
              _startWorker(masterState);
            } else {
              process.exit(1);
            }
          });

          // fork each app process
          var workers = config.server.workers;
          for(var i = 0; i < workers; ++i) {
            _startWorker(masterState, i === 0);
          }

          callback();
        }
      ], function(err) {
        if(err) {
          logger.critical('Error: ' + err, err);
          process.exit(1);
        }
      });
    } else {
      // set 'ps' title
      var args = process.argv.slice(2).join(' ');
      process.title = config.app.workerTitle + (args ? (' ' + args) : '');

      // log uncaught exception and exit, except in test mode
      if (process.env.NODE_ENV !== 'test')
      {
        process.on('uncaughtException', function(err) {
          logger.critical('uncaught error: ' + err, err);
          process.removeAllListeners('uncaughtException');
          process.exit();
        });
      }

      logger.info('running bedrock worker process...');

      // create app
      var app = {};

      // create express server
      var server = express();
      app.server = server;
      app.server.earlyHandlers = [];
      app.server.errorHandlers = [];

      // listen for master process exit
      process.on('message', function(msg) {
        if(msg.type && msg.type === 'app' && msg.message === 'exit') {
          // stop HTTP and HTTPS server
          if(app && app.httpServer) {
            app.httpServer.close();
          }
          if(app && app.httpsServer) {
            app.httpsServer.close();
          }
          // exit
          process.exit();
        }
      });

      // init limiter
      limiter.init(app, function() {});

      // init validation
      api.validation.init();

      // redefine logger token for remote-addr to use express-parsed ip
      // (includes X-Forwarded-For header if available)
      express.logger.token('remote-addr', function(req) {
        return req.ip;
      });

      // default jsonld mimetype
      express.static.mime.define({'application/ld+json': ['jsonld']});

      // set the default timezone offset for the template system
      swig.setDefaultTZOffset(0);

      // configure server
      var accessLogger = loggers.get('access');
      server.enable('trust proxy');
      server.disable('x-powered-by');
      server.use(express.logger({
        stream: {write: function(str) {accessLogger.log('info', str);}}
      }));
      server.use(express.methodOverride());
      // rate limit based on IP address
      server.use(limiter.ipRateLimit);
      server.use(express.bodyParser());
      server.use(express.cookieParser(config.server.session.secret));
      if(config.environment !== 'down') {
        var sessionCfg = {};
        if(config.modules.indexOf('database') !== -1) {
          var database = require(__dirname + '/bedrock/database');
          sessionCfg.store = database.createSessionStore(express);
        }
        server.use(express.session(tools.extend(
          sessionCfg, config.server.session)));
        server.use(passport.initialize());
        server.use(passport.session());
      }
      // all custom early handlers to be added later
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
      // add each static path
      for(var i = config.server.static.length - 1; i >= 0; --i) {
        var cfg = config.server.static[i];
        if(typeof cfg === 'string') {
          cfg = {route: '/', path: cfg};
        }
        var p = path.resolve(cfg.path);
        if(cfg.file) {
          // serve single file
          logger.debug('serving route: "' + cfg.route +
            '" with file: "' + p + '"');
          server.use(cfg.route, _serveFile(p));
        } else {
          // serve directory
          logger.debug('serving route: "' + cfg.route +
            '" with dir: "' + p + '"');
          server.use(cfg.route, express.static(p, config.server.staticOptions));
        }
      }
      // do not cache non-static resources
      server.use(function(req, res, next) {
        res.header('Cache-Control', 'no-cache, no-store, must-revalidate');
        res.header('Pragma', 'no-cache');
        res.header('Expires', '0');
        next();
      });
      server.use(server.router);
      // all custom error handlers to be added later
      server.use(function(err, req, res, next) {
        var i = -1;
        (function nextHandler(err) {
          i += 1;
          return (i === server.errorHandlers.length ?
            next(err) : server.errorHandlers[i](err, req, res, nextHandler));
        })(err);
      });
      if(config.environment === 'development') {
        server.use(express.errorHandler(
          {dumpExceptions: true, showStack: true}));
      } else {
        server.use(express.errorHandler());
      }

      // serve express via TLS server
      var httpsOptions = {
        key: fs.readFileSync(config.server.key),
        cert: fs.readFileSync(config.server.cert)
      };
      var caFiles = config.server.ca;
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
          }
          catch(e) {
            throw new Error(e.message);
          }
          httpsOptions.ca.push.apply(httpsOptions.ca, bundle);
        });
      }
      var https_ = https.createServer(httpsOptions, app.server);
      app.httpsServer = https_;

      // redirect plain http traffic to https
      var redirect = express();
      redirect.enable('trust proxy');
      redirect.use(express.logger({
        format: '(http) ' + express.logger['default'],
        stream: {write: function(str) {accessLogger.log('info', str);}}
      }));
      redirect.get('*', function(req, res) {
        res.redirect('https://' + config.server.host + req.url);
      });
      var http_ = http.createServer(redirect);
      app.httpServer = http_;

      // enable unlimited listeners on servers
      https_.setMaxListeners(0);
      http_.setMaxListeners(0);

      async.auto({
        buildDocIndex: function(callback) {
          var docs = require(__dirname + '/bedrock/docs');
          docs.buildDocumentationIndex(callback);
        },
        httpsListen: ['buildDocIndex', function(callback) {
          async.forEach(config.server.bindAddr, function(addr, next) {
            https_.on('error', function(err) {throw err;});
            https_.listen(config.server.port, addr, function() {next();});
          }, callback);
        }],
        httpListen: ['buildDocIndex', function(callback) {
          async.forEach(config.server.bindAddr, function(addr, next) {
            http_.on('error', function(err) {throw err;});
            http_.listen(config.server.httpPort, addr, function() {next();});
          }, callback);
        }],
        loadModules: ['httpsListen', 'httpListen', function(callback) {
          // switch user
          if(config.environment !== 'development') {
            process.setgid(config.app.user.groupId);
            process.setuid(config.app.user.userId);
          }

          // send ready message to master
          process.send({type: 'ready'});

          var logger = loggers.get('app');
          logger.info('started server on port ' + config.server.port);

          // load dynamic modules based on environment
          var modules;
          if(config.environment in config.envModules) {
            modules = config.envModules[config.environment];
          } else {
            modules = config.modules;
          }
          // require modules
          var moduleApis = [];
          modules.forEach(function(mod) {
            if(mod[0] !== '/') {
              mod = __dirname + '/bedrock/' + mod;
            }
            mod = path.resolve(mod);
            logger.info('loading module: "%s"', mod);
            var moduleApi = require(mod);
            moduleApis.push(moduleApi);
            logger.info('loaded module: "%s" as: "%s"', mod, moduleApi.name);
            api.modules[moduleApi.name] = moduleApi;
          });
          // init modules
          async.forEachSeries(moduleApis, function(moduleApi, callback) {
            logger.info('initializing module: "' + moduleApi.name + '"');
            moduleApi.init(app, function moduleLoaded(err) {
              if(!err) {
                logger.info('module initialized: "' + moduleApi.name + '"');
              }
              callback(err);
            });
          }, callback);
        }]
      }, function(err) {
        if(err) {
          throw err;
        }
        logger.info('all modules loaded');
        var dtTime = Date.now() - startTime;
        logger.info('startup time: ' + dtTime + 'ms');
        logger.info('server url: https://' +
          config.server.bindAddr + ':' + config.server.port);
      });
    }
  });
};

// starts a new worker process
function _startWorker(state, testRunner) {
  var workerEnv = {};
  if(testRunner) {
    workerEnv.TEST_RUNNER = '1';
  }
  var worker = cluster.fork(workerEnv);
  loggers.attach(worker);

  // listen to exit requests from workers
  worker.on('message', function(msg) {
    if(msg.type && msg.type === 'app' && msg.message === 'exit') {
      process.exit(msg.status);
    }
  });

  // if app process user hasn't been switched yet, wait for a message
  // from a worker indicating it is ready
  if(!state.switchedUser) {
    var listener = function(msg) {
      if(msg.type === 'ready') {
        worker.removeListener('message', listener);
        if(!state.switchedUser) {
          state.switchedUser = true;
          if(config.environment !== 'development') {
            // switch user
            process.setgid(config.app.user.groupId);
            process.setuid(config.app.user.userId);
          }
        }
      }
    };
    worker.on('message', listener);
  }
}

// creates middleware for serving a single static file
function _serveFile(file) {
  return function(req, res) {
    res.sendfile(file, config.server.staticOptions);
  };
}
