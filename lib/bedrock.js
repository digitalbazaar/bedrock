/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var cluster = require('cluster');
var docs = require(__dirname + '/bedrock/docs');
var events = require(__dirname + '/bedrock/events');
var jsonld = require(__dirname + '/bedrock/jsonld');
var path = require('path');
var config = require('./config');
var program = require('commander');
var loggers = require(__dirname + '/bedrock/loggers');
var security = require(__dirname + '/bedrock/security');
var swig = require('swig');
var tools = require(__dirname + '/bedrock/tools');
var validation = require(__dirname + '/bedrock/validation');
var pkginfo = require('pkginfo');

var BedrockError = tools.BedrockError;

var api = {};
api.config = config;
api.docs = docs;
api.events = events;
api.jsonld = jsonld;
api.loggers = loggers;
api.security = security;
api.tools = tools;
api.validation = validation;
api.modules = {};
module.exports = api;
// read package.json fields
pkginfo(module, 'version');

// gets a module by name
api.module = function(name) {
  if(name in api.modules) {
    return api.modules[name];
  }
  if(name in api) {
    return api[name];
  }
  throw new Error('Unregistered bedrock module: "' + name + '".');
};

// expose bedrock program
api.program = program.version(api.version);

/**
 * Start the Bedrock server.
 *
 * @param options FIXME
 * @param done(err) callback when Bedrock is started or has startup error.
 */
api.start = function(options, done) {
  if(typeof options === 'function') {
    done = options;
    options = null;
  }
  options = options || {};

  var startTime = Date.now();

  function collect(val, memo) {
    memo.push(val);
    return memo;
  }

  // add built-in options and parse
  program
    .option('--config <config>',
      'Load a config file. (repeatable)', collect, [])
    .option('--log-level <level>',
      'Console log level: ' +
      'silly, verbose, debug, info, warning, error, critical.')
    .option('--log-timestamps <timestamps>',
      'Override console log timestamps config. (boolean)', tools.boolify)
    .option('--log-colorize <colorize>',
      'Override console log colorization config. (boolean)', tools.boolify)
    .option('--log-transports <spec>',
      'Transport spec. Use category=[-|+]transport[;...][, ...] ' +
      'eg, access=+console;-access,app=-console')
    .option('--silent', 'Show no console output.')
    .option('--workers <num>',
      'The number of workers to use (0: # of cpus).', parseInt);

  // allow skipping normal arg parsing during testing
  var parseArgs = (config.cli && 'parseArgs' in config.cli) ?
    config.cli.parseArgs : true;
  if(parseArgs) {
    program.parse(process.argv);

    // load configs first
    program.config.forEach(function(cfg) {
      require(path.resolve(process.cwd(), cfg));
    });
  }

  // set console log flags
  if('logLevel' in program) {
    config.loggers.console.level = program.logLevel;
  }
  if('logColorize' in program) {
    config.loggers.console.colorize = program.logColorize;
  }
  if('logTimestamps' in program) {
    config.loggers.console.timestamp = program.logTimestamps;
  }
  // adjust transports
  if('logTransports' in program) {
    var t = program.logTransports;
    var cats = t.split(',');
    _.each(cats, function(cat) {
      var catName = cat.split('=')[0];
      var catTransports;
      if(catName in config.loggers.categories) {
        catTransports = config.loggers.categories[catName];
      } else {
        catTransports = config.loggers.categories[catName] = [];
      }
      var transports = cat.split('=')[1].split(';');
      _.each(transports, function(transport) {
        if(transport.indexOf('-') === 0) {
          var tName = transport.slice(1);
          var tIndex = catTransports.indexOf(tName);
          if(tIndex !== -1) {
            catTransports.splice(tIndex, 1);
          }
        } else if(transport.indexOf('+') === 0) {
          var tName = transport.slice(1);
          var tIndex = catTransports.indexOf(tName);
          if(tIndex === -1) {
            catTransports.push(tName);
          }
        } else {
          var tName = transport;
          var tIndex = catTransports.indexOf(tName);
          if(tIndex === -1) {
            catTransports.push(tName);
          }
        }
      });
    });
  }
  if(program.silent || program.logLevel === 'none') {
    config.loggers.console.silent = true;
  }
  // TODO: obsolete config.server.workers
  if('workers' in config.server) {
    if(cluster.isMaster) {
      console.warn(
        'config.server.workers is deprecated, use config.app.workers instead');
    }
    config.app.workers = config.server.workers;
  }
  if('workers' in program) {
    config.app.workers = program.workers;
  }
  if(config.app.workers <= 0) {
    config.app.workers = require('os').cpus().length;
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
      } catch(ex) {
        console.log('Failed to set gid: ' + ex);
      }
    }
  }

  // initialize logging system
  loggers.init(function(err) {
    if(err) {
      // can't log, quit
      console.error('Loggers init failed:', err);
      process.exit(1);
    }

    var logger = loggers.get('app');

    if(cluster.isMaster) {
      logger.info('starting bedrock...');

      // setup cluster if running with istanbul coverage
      if(process.env.running_under_istanbul) {
        // re-call cover with no reporting and using pid named output
        cluster.setupMaster({
          exec: './node_modules/.bin/istanbul',
          args: [
            'cover', '--report', 'none', '--print', 'none', '--include-pid',
            process.argv[1], '--'].concat(process.argv.slice(2))
        });
      }

      // set 'ps' title
      var args = process.argv.slice(2).join(' ');
      process.title = config.app.masterTitle + (args ? (' ' + args) : '');

      // log uncaught exception and exit, except in test mode
      if(process.env.NODE_ENV !== 'test') {
        process.on('uncaughtException', function(err) {
          logger.critical(
            'uncaught error:', err.stack ? err.stack : err.toString);
          process.removeAllListeners('uncaughtException');
          process.exit(1);
        });
      }

      logger.info('running bedrock master process', {pid: process.pid});

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
          var workers = config.app.workers;
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
      if(process.env.NODE_ENV !== 'test') {
        process.on('uncaughtException', function(err) {
          logger.critical(
            'uncaught error:', err.stack ? err.stack : err.toString);
          process.removeAllListeners('uncaughtException');
          process.exit();
        });
      }

      logger.info('running bedrock worker process');

      // create app
      var app = {};
      // TODO: remove reference to app once unnecessary
      api.app = app;

      // listen for master process exit
      process.on('message', function(msg) {
        if(msg.type && msg.type === 'app' && msg.message === 'exit') {
          events.emit('bedrock.stop', function(err) {
            if(err) {
              throw err;
            }
            events.emit('bedrock.exit');
            process.exit();
          });
        }
      });

      // listen for error events
      events.on('bedrock.error', function(err) {
        if(done) {
          return done(err);
        }
        throw err;
      });

      // set the default timezone offset for the template system
      swig.setDefaultTZOffset(0);

      var logger = loggers.get('app');

      async.auto({
        beforeLoadModules: function(callback) {
          events.emit('bedrock.modules.load', callback);
        },
        loadModules: ['beforeLoadModules', function(callback, results) {
          if(results.beforeLoadModules === false) {
            return callback();
          }

          // TODO: convert to module
          // init validation
          events.emit('bedrock-validation.init');
          api.validation.init();
          events.emit('bedrock-validation.ready');

          // TODO: don't force loading of bedrock-server, load just like
          // any other module
          require(__dirname + '/bedrock/bedrock-server');

          // TODO: don't force loading of bedrock-express, load just like
          // any other module
          require(__dirname + '/bedrock/bedrock-express');

          // TODO: don't force loading of limiter, load just like
          // any other module
          // TODO: rename to bedrock-express-limiter
          require(__dirname + '/bedrock/limiter');

          // load dynamic modules based on environment
          var modules;
          if(config.environment in config.envModules) {
            modules = config.envModules[config.environment];
          } else {
            modules = config.modules;
          }
          // require modules
          // TODO: no need for moduleApis array w/new bedrock module approach
          // instead use require() API where necessary
          var moduleApis = [];
          modules.forEach(function(mod) {
            // check for absolute path on Unix and Windows
            if(mod[0] !== '/' && (mod[1] !== ':' && mod[2] !== '\\')) {
              mod = __dirname + '/bedrock/' + mod;
            }
            mod = path.resolve(mod);
            events.emit('bedrock.module.load', mod);
            logger.info('loading module: "%s"', mod);
            var moduleApi = require(mod);
            moduleApis.push(moduleApi);
            // TODO: remove api.modules, simply use require() API
            logger.debug('loaded module: "%s" as: "%s"', mod, moduleApi.name);
            api.modules[moduleApi.name] = moduleApi;
          });
          // backwards compatibility support for old module API
          moduleApis.forEach(function(moduleApi) {
            if(!moduleApi.init) {
              return;
            }
            logger.warning('loading module with deprecated API: "' +
              moduleApi.name + '"');
            events.on('bedrock.modules.init', function(callback) {
              logger.info('initializing module: "' + moduleApi.name + '"');
              moduleApi.init(app, function moduleLoaded(err) {
                if(!err) {
                  logger.debug(
                    'module initialized: "' + moduleApi.name + '"');
                  return callback();
                }

                callback(new BedrockError(
                  'Error initializing module.',
                  'bedrock.ModuleError', {
                    module: moduleApi.name
                  }, err));
              });
            });
          });
          callback();
        }],
        initModules: ['loadModules', function(callback, results) {
          if(results.beforeLoadModules === false) {
            return callback();
          }
          events.emit('bedrock.modules.init', callback);
        }],
        start: ['initModules', function(callback) {
          events.emit('bedrock.start', callback);
        }],
        ready: ['start', function(callback) {
          logger.info('all modules loaded');
          var dtTime = Date.now() - startTime;
          logger.info('startup time: ' + dtTime + 'ms');
          events.emit('bedrock.ready', callback);
        }],
        started: ['ready', function(callback) {
          events.emit('bedrock.started', callback);
        }]
      }, function(err) {
        if(err) {
          return events.emit('bedrock.error', err);
        }
        if(done) {
          done(null);
        }
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
