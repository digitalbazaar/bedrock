/*
 * Copyright (c) 2012-2016 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var brUtil = require('./util');
var cc = brUtil.config.main.computer();
var cluster = require('cluster');
var config = require('./config');
var errio = require('errio');
var events = require('./events');
var jsonld = require('./jsonld');
var loggers = require('./loggers');
var path = require('path');
var pkginfo = require('pkginfo');
var program = require('commander');
var test = require('./test');
const BedrockError = brUtil.BedrockError;

// core API
var api = {};
api.config = config;
api.events = events;
api.jsonld = jsonld;
api.loggers = loggers;
api.test = test;
// NOTE: api.tools is deprecated
api.util = api.tools = brUtil;
module.exports = api;

// read package.json fields
pkginfo(module, 'version');

// register error class
errio.register(BedrockError);

// config paths
// configured here instead of config.js due to util dependency issues
// FIXME: v2.0.0: remove when removing warnings below.
const _warningShown = {
  cache: false,
  log: false
};
cc({
  'paths.cache': () => {
    // FIXME: v2.0.0: remove warning and default and throw exception .
    //throw new BedrockError(
    //  'bedrock.config.paths.cache not set.',
    //  'ConfigError');
    const cachePath = path.join(__dirname, '..', '.cache');
    if(!_warningShown.cache) {
      loggers.get('app').error(
        `"bedrock.config.paths.cache" not set, using default: "${cachePath}"`);
      _warningShown.cache = true;
    }
    return cachePath;
  },
  'paths.log': () => {
    // FIXME: v2.0.0: remove warning and default and throw exception .
    //throw new BedrockError(
    //  'bedrock.config.paths.log not set.',
    //  'ConfigError');
    const logPath = path.join('/tmp/bedrock-dev');
    if(!_warningShown.log) {
      // Using console since this config value used during logger setup.
      console.warn('WARNING: ' +
        `"bedrock.config.paths.log" not set, using default: "${logPath}"`);
      _warningShown.log = true;
    }
    return logPath;
  }
});

// expose bedrock program
api.program = program.version(api.version);

/**
 * Starts the bedrock application.
 *
 * @param options the options to use:
 *          [script] the script to execute when forking bedrock workers, by
 *            default this will be process.argv[1].
 * @param done(err) called by bedrock workers once the bedrock application has
 *          started or once an error has occured.
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

  // add built-in CLI options
  program
    .option('--config <config>',
      'Load a config file. (repeatable)', collect, [])
    .option('--log-level <level>',
      'Console log level: ' +
      'silly, verbose, debug, info, warning, error, critical.')
    .option('--log-timestamps <timestamps>',
      'Override console log timestamps config. (boolean)', brUtil.boolify)
    .option('--log-colorize <colorize>',
      'Override console log colorization config. (boolean)', brUtil.boolify)
    .option('--log-exclude <modules>',
      'Do not log events from the specified comma separated modules.')
    .option('--log-only <modules>',
      'Only log events from the specified comma separated modules.')
    .option('--log-transports <spec>',
      'Transport spec. Use category=[-|+]transport[;...][, ...] ' +
      'eg, access=+console;-access,app=-console')
    .option('--silent', 'Show no console output.')
    .option('--workers <num>',
      'The number of workers to use (0: # of cpus).', parseInt);

  async.auto({
    beforeInit: function(callback) {
      events.emit('bedrock-cli.init', callback);
    },
    cliParse: ['beforeInit', function(results, callback) {
      _parseCommandLine();
      events.emit('bedrock-cli.parsed', callback);
    }],
    init: ['cliParse', function(results, callback) {
      _loadConfigs();
      _configureLoggers();
      _configureWorkers();
      _configureProcess();
      events.emit('bedrock-loggers.init', callback);
    }],
    initLoggers: ['init', function(results, callback) {
      loggers.init(function(err) {
        if(err) {
          // can't log, quit
          console.error('Failed to initialize logging system:', err);
          process.exit(1);
        }
        callback();
      });
    }],
    run: ['initLoggers', function(results, callback) {
      if(cluster.isMaster) {
        _runMaster(options);
        // don't call callback in master process
        return;
      }
      _runWorker(startTime, function(err) {
        if(err) {
          return events.emit('bedrock.error', err, function() {
            callback(err);
          });
        }
        callback();
      });
    }]
  }, function(err) {
    if(done) {
      return done(err);
    }
    if(err) {
      throw err;
    }
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
  // switch group
  if(config.core.running.groupId && process.setgid) {
    process.setgid(config.core.running.groupId);
  }
  // switch user
  if(config.core.running.userId && process.setuid) {
    process.setuid(config.core.running.userId);
  }
  // send message to master
  process.send({type: 'bedrock.switchProcessUser'});
};
var _switchedProcessUser = false;

/**
 * Called from a worker to executes the given function in only one worker.
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

  var ran = false;
  function runOnce(msg) {
    // ignore other messages
    if(!_isMessageType(msg, 'bedrock.runOnce') || msg.id !== id) {
      return;
    }

    process.removeListener('bedrock.runOnce', runOnce);

    if(msg.error) {
      msg.error = errio.fromObject(msg.error, {stack: true});
    }

    if(msg.done) {
      return callback(msg.error, ran);
    }

    var _callback = function(err) {
      var _msg = {
        type: 'bedrock.runOnce',
        id: id,
        done: true
      };
      if(err) {
        _msg.error = errio.toObject(err, {stack: true});
      }
      process.send(_msg);
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

/**
 * Called from a worker to exit gracefully. Typically used by subcommands.
 */
api.exit = function() {
  cluster.worker.kill();
};

function _parseCommandLine() {
  program.parse(process.argv);
  if(config.cli.command === null) {
    // set default command
    config.cli.command = new program.Command('bedrock');
  }
}

function _loadConfigs() {
  program.config.forEach(function(cfg) {
    require(path.resolve(process.cwd(), cfg));
  });
}

function _configureLoggers() {
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
  if('logExclude' in program) {
    config.loggers.console.bedrock.excludeModules =
      program.logExclude.split(',');
  }
  if('logOnly' in program) {
    config.loggers.console.bedrock.onlyModules = program.logOnly.split(',');
  }
  // adjust transports
  if('logTransports' in program) {
    var t = program.logTransports;
    var cats = t.split(',');
    cats.forEach(function(cat) {
      var catName = cat.split('=')[0];
      var catTransports;
      if(catName in config.loggers.categories) {
        catTransports = config.loggers.categories[catName];
      } else {
        catTransports = config.loggers.categories[catName] = [];
      }
      var transports = cat.split('=')[1].split(';');
      transports.forEach(function(transport) {
        if(transport.indexOf('-') === 0) {
          const tName = transport.slice(1);
          const tIndex = catTransports.indexOf(tName);
          if(tIndex !== -1) {
            catTransports.splice(tIndex, 1);
          }
        } else if(transport.indexOf('+') === 0) {
          const tName = transport.slice(1);
          const tIndex = catTransports.indexOf(tName);
          if(tIndex === -1) {
            catTransports.push(tName);
          }
        } else {
          const tName = transport;
          const tIndex = catTransports.indexOf(tName);
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
}

function _configureWorkers() {
  if('workers' in program) {
    config.core.workers = program.workers;
  }
  if(config.core.workers <= 0) {
    config.core.workers = require('os').cpus().length;
  }
}

function _configureProcess() {
  // set no limit on event listeners
  process.setMaxListeners(0);

  // exit on terminate
  process.on('SIGTERM', function() {
    process.exit();
  });

  if(cluster.isMaster) {
    cluster.setupMaster({
      exec: path.join(__dirname, 'worker.js')
    });

    // set group before initializing loggers
    if(config.core.starting.groupId && process.setgid) {
      try {
        process.setgid(config.core.starting.groupId);
      } catch(ex) {
        console.warn('Failed to set master starting gid: ' + ex);
      }
    }
    // set user before initializing loggers
    if(config.core.starting.userId && process.setuid) {
      try {
        process.setuid(config.core.starting.userId);
      } catch(ex) {
        console.warn('Failed to set master starting uid: ' + ex);
      }
    }
  }
}

function _setupUncaughtExceptionHandler(mode, logger) {
  // log uncaught exception and exit, except in test mode
  if(config.cli.command.name() !== 'test') {
    process.on('uncaughtException', function(err) {
      process.removeAllListeners('uncaughtException');
      logger.critical(mode + ': uncaught error:', err);
      process.exit(1);
    });
  }
}

function _runMaster(options) {
  // get starting script
  var script = options.script || process.argv[1];

  var logger = loggers.get('app');
  logger.info('starting bedrock...');

  // setup cluster if running with istanbul coverage
  if(process.env.running_under_istanbul) {
    // TODO: does this need adjusting after fixing the worker `cwd` issue?
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
  process.title = config.core.master.title + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler('master', logger);

  logger.info('running bedrock master process "' +
    config.core.master.title + '"', {pid: process.pid});

  // keep track of master state
  var masterState = {
    switchedUser: false,
    runOnce: {}
  };

  // notify workers to exit if master exits
  process.on('exit', function() {
    for(var id in cluster.workers) {
      cluster.workers[id].send({type: 'bedrock.core', message: 'exit'});
    }
  });

  // handle worker exit
  cluster.on('exit', function(worker, code) {
    // if the worker called kill() or disconnect(), it was intentional, so exit
    // the process
    if(worker.exitedAfterDisconnect) {
      logger.info(
        'worker ' + worker.process.pid + ' exited on purpose with code ' +
        code + '; exiting master process.');
      process.exit(code);
    }

    // accidental worker exit (crash)
    logger.critical(
      'worker ' + worker.process.pid + ' exited with code ' + code);

    // if configured, fork a replacement worker
    if(config.core.worker.restart) {
      // clear any runOnce records w/allowOnRestart option set
      for(var id in masterState.runOnce) {
        if(masterState.runOnce[id].worker === worker.id &&
          masterState.runOnce[id].options.allowOnRestart) {
          delete masterState.runOnce[id];
        }
      }
      _startWorker(masterState, script);
    } else {
      process.exit(1);
    }
  });

  // fork each app process
  var workers = config.core.workers;
  for(var i = 0; i < workers; ++i) {
    _startWorker(masterState, script);
  }
}

function _runWorker(startTime, done) {
  var logger = loggers.get('app');

  // set 'ps' title
  var args = process.argv.slice(2).join(' ');
  process.title = config.core.worker.title + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler('worker', logger);

  logger.info('running bedrock worker process "' +
    config.core.worker.title + '"');

  // listen for master process exit
  var bedrockStarted = false;
  process.on('message', function(msg) {
    if(!_isMessageType(msg, 'bedrock.core') || msg.message !== 'exit') {
      return;
    }

    if(!bedrockStarted) {
      return events.emit('bedrock-cli.exit', function() {
        process.exit();
      });
    }

    events.emit('bedrock.stop', function(err) {
      if(err) {
        throw err;
      }
      events.emit('bedrock-cli.exit', function() {
        process.exit();
      });
    });
  });

  async.auto({
    cliReady: function(callback) {
      events.emit('bedrock-cli.ready', callback);
    },
    configure: ['cliReady', function(results, callback) {
      if(results.cliReady === false) {
        // skip default behavior (do not emit bedrock core events)
        return done();
      }
      bedrockStarted = true;
      events.emit('bedrock.configure', callback);
    }],
    adminInit: ['configure', function(results, callback) {
      events.emit('bedrock.admin.init', callback);
    }],
    init: ['adminInit', function(results, callback) {
      // set process user
      api.setProcessUser();
      events.emit('bedrock.init', callback);
    }],
    start: ['init', function(results, callback) {
      events.emit('bedrock.start', callback);
    }],
    ready: ['start', function(results, callback) {
      var dtTime = Date.now() - startTime;
      logger.info('startup time: ' + dtTime + 'ms');
      events.emit('bedrock.ready', callback);
    }],
    started: ['ready', function(results, callback) {
      events.emit('bedrock.started', callback);
    }]
  }, function(err) {
    done(err);
  });
}

function _startWorker(state, script) {
  var worker = cluster.fork();
  loggers.attach(worker);

  // listen to start requests from workers
  worker.on('message', initWorker);

  // TODO: simplify with cluster.on('online')?
  function initWorker(msg) {
    if(!_isMessageType(msg, 'bedrock.worker.started')) {
      return;
    }
    // notify worker to initialize and provide the cwd and script to run
    worker.removeListener('message', initWorker);
    worker.send({
      type: 'bedrock.worker.init',
      cwd: process.cwd(),
      script: script
    });
  }

  // listen to exit requests from workers
  worker.on('message', function(msg) {
    if(_isMessageType(msg, 'bedrock.core') && msg.message === 'exit') {
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
      // switch group
      if(config.core.running.groupId && process.setgid) {
        process.setgid(config.core.running.groupId);
      }
      // switch user
      if(config.core.running.userId && process.setuid) {
        process.setuid(config.core.running.userId);
      }
    }
  }

  // listen to schedule run once functions
  worker.on('message', function(msg) {
    if(!_isMessageType(msg, 'bedrock.runOnce')) {
      return;
    }

    if(msg.done) {
      state.runOnce[msg.id].done = true;
      state.runOnce[msg.id].error = msg.error || null;
      // notify workers to call callback
      var notify = state.runOnce[msg.id].notify;
      while(notify.length > 0) {
        var id = notify.shift();
        if(id in cluster.workers) {
          cluster.workers[id].send({
            type: 'bedrock.runOnce',
            id: msg.id,
            done: true,
            error: msg.error
          });
        }
      }
      return;
    }

    if(msg.id in state.runOnce) {
      if(state.runOnce[msg.id].done) {
        // already ran, notify worker immediately
        worker.send({
          type: 'bedrock.runOnce',
          id: msg.id,
          done: true,
          error: state.runOnce[msg.id].error
        });
      } else {
        // still running, add worker ID to notify queue for later notification
        state.runOnce[msg.id].notify.push(worker.id);
      }
      return;
    }

    // run in this worker
    state.runOnce[msg.id] = {
      worker: worker.id,
      notify: [worker.id],
      options: msg.options,
      done: false,
      error: null
    };
    worker.send({type: 'bedrock.runOnce', id: msg.id, done: false});
  });
}

function _isMessageType(msg, type) {
  return (typeof msg === 'object' && msg.type === type);
}
