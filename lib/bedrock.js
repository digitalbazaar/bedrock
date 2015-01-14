/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var cluster = require('cluster');
// TODO: move to /lib
var events = require(__dirname + '/bedrock/events');
// TODO: move to /lib
var jsonld = require(__dirname + '/bedrock/jsonld');
var path = require('path');
var config = require('./config');
var program = require('commander');
// TODO: move to /lib
var loggers = require(__dirname + '/bedrock/loggers');
// TODO: move to /lib
var security = require(__dirname + '/bedrock/security');
// TODO: move to /lib
var tools = require(__dirname + '/bedrock/tools');
var pkginfo = require('pkginfo');

var BedrockError = tools.BedrockError;

var api = {};
api.config = config;
api.events = events;
api.jsonld = jsonld;
api.loggers = loggers;
api.security = security;
api.tools = tools;
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
        console.warn('Failed to set gid: ' + ex);
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

      // keep track of master state
      var masterState = {
        switchedUser: false,
        runOnce: {}
      };

      // notify workers to exit if master exits
      process.on('exit', function() {
        for(var id in cluster.workers) {
          cluster.workers[id].send({type: 'bedrock.app', message: 'exit'});
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
          // clear any run once records w/allowOnRestart option set
          for(var id in masterState.runOnce) {
            if(masterState.runOnce[id].worker === worker.process.pid &&
              masterState.runOnce[id].options.allowOnRestart) {
              delete masterState.runOnce[id];
            }
          }
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

      return;
    }

    // worker code path

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
      if(!_isMessageType(msg, 'bedrock.app') || msg.message !== 'exit') {
        return;
      }

      events.emit('bedrock.stop', function(err) {
        if(err) {
          throw err;
        }
        events.emit('bedrock.exit');
        process.exit();
      });
    });

    // listen for error events
    events.on('bedrock.error', function(err) {
      if(done) {
        return done(err);
      }
      throw err;
    });

    var logger = loggers.get('app');

    async.auto({
      beforeLoadModules: function(callback) {
        events.emit('bedrock.modules.load', callback);
      },
      loadModules: ['beforeLoadModules', function(callback, results) {
        if(results.beforeLoadModules === false) {
          return callback();
        }

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
          // FIXME: temporary hack for modules that start with bedrock-
          if(mod.indexOf('bedrock-') !== 0) {
            // check for absolute path on Unix and Windows
            if(mod[0] !== '/' && (mod[1] !== ':' && mod[2] !== '\\')) {
              mod = __dirname + '/bedrock/' + mod;
            }
            mod = path.resolve(mod);
          }
          events.emit('bedrock.module.load', mod);
          logger.info('loading module: "%s"', mod);
          var moduleApi = require(mod);
          moduleApis.push(moduleApi);
          // TODO: remove api.modules, simply use require() API
          if(moduleApi.name) {
            logger.debug('loaded module: "%s" as: "%s"', mod, moduleApi.name);
          } else {
            logger.debug('loaded module: "%s"', mod);
          }
          api.modules[moduleApi.name] = moduleApi;

          // backwards compatibility support for old module API
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
        // set process user
        api.setProcessUser();
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
  });
};

/**
 * Called from workers to set the worker and master process user if it hasn't
 * already been set.
 */
api.setProcessUser = function() {
  if(_switchedProcessUser) {
    return;
  }
  _switchedProcessUser = true;
  if(config.environment !== 'development') {
    process.setgid(config.app.user.groupId);
    process.setuid(config.app.user.userId);
  }
  // send message to master
  process.send({type: 'bedrock.switchProcessUser'});
};
var _switchedProcessUser = false;

/**
 * Executes the given function in only one worker.
 *
 * @param id a unique identifier for the function to execute.
 * @param fn the function to execute; if it takes a parameter, it will be
 *          assumed to be a callback and `fn` will be executed asynchronously.
 * @param [options] the options to use:
 *          [allowOnRestart] true to allow this function to execute again,
 *            but only once, on worker restart; this option is useful for
 *            behavior that persists but should only run in a single worker.
 * @param callback(err, ran) called once the operation has completed in
 *          one worker.
 */
api.runOnce = function(id, fn, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  // listen to run function once
  process.on('message', runOnce);

  var err = null;
  var ran = false;
  function runOnce(msg) {
    // ignore other messages
    if(!_isMessageType(msg, 'bedrock.runOnce') || msg.id !== id) {
      return;
    }

    process.removeListener('bedrock.runOnce', runOnce);

    if(msg.done) {
      return callback(err, ran);
    }

    var _callback = function(err) {
      err = null;
      process.send({type: 'bedrock.runOnce', id: id, done: true});
    };

    // run in this worker
    if(fn.length > 0) {
      return fn(_callback);
    }
    try {
      fn();
    } catch(e) {
      return _callback(e);
    }
    _callback();
  }

  // schedule function to run
  process.send({type: 'bedrock.runOnce', id: id, options: options});
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
    if(_isMessageType(msg, 'bedrock.app') && msg.message === 'exit') {
      process.exit(msg.status);
    }
  });

  // if app process user hasn't been switched yet, wait for a message
  // from a worker indicating to do so
  if(!state.switchedUser) {
    worker.on('message', switchProcessUserListener);
  }

  function switchProcessUserListener(msg) {
    if(!_isMessageType(msg, 'bedrock.switchProcessUser')) {
      return;
    }
    worker.removeListener('message', switchProcessUserListener);
    if(!state.switchedUser) {
      state.switchedUser = true;
      if(config.environment !== 'development') {
        // switch user
        process.setgid(config.app.user.groupId);
        process.setuid(config.app.user.userId);
      }
    }
  }

  // listen to schedule run once functions
  worker.on('message', function(msg) {
    if(!_isMessageType(msg, 'bedrock.runOnce')) {
      return;
    }
    if(msg.done) {
      // notify workers to call callback
      for(var id in cluster.workers) {
        cluster.workers[id].send(
          {type: 'bedrock.runOnce', id: msg.id, done: true});
      }
      return;
    }

    if(msg.id in state.runOnce) {
      // already ran/running
      return;
    }

    // run in this worker
    state.runOnce[msg.id] = {worker: worker.process.pid, options: msg.options};
    worker.send({type: 'bedrock.runOnce', id: msg.id, done: false});
  });
}

function _isMessageType(msg, type) {
  return (typeof msg === 'object' && msg.type === type);
}
