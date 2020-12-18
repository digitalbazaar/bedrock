/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const brUtil = require('./util');
const cc = brUtil.config.main.computer();
const cluster = require('cluster');
const config = require('./config');
const cycle = require('cycle');
const errio = require('errio');
const events = require('./events');
const lodashGet = require('lodash.get');
const loggers = require('./loggers');
const path = require('path');
const pkginfo = require('pkginfo');
const program = require('commander');
const {deprecate} = require('util');
const {BedrockError} = brUtil;

// core API
const api = {};
api.config = config;
api.events = events;
api.loggers = loggers;
api.util = brUtil;
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
 *
 * @returns {Promise} Resolves when the application has started or an error has
 *            occured.
 */
api.start = async options => {
  options = options || {};

  const startTime = Date.now();

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

  await events.emit('bedrock-cli.init');
  _parseCommandLine();
  await events.emit('bedrock-cli.parsed');
  _loadConfigs();
  _configureLoggers();
  _configureWorkers();
  _configureProcess();
  await events.emit('bedrock-loggers.init');

  try {
    await loggers.init();
  } catch(err) {
    // can't log, quit
    console.error('Failed to initialize logging system:', err);
    process.exit(1);
  }
  // run
  if(cluster.isMaster) {
    _runMaster(startTime, options);
    // don't call callback in master process
    return;
  }
  try {
    await _runWorker(startTime);
  } catch(err) {
    await events.emit('bedrock.error', err);
    throw err;
  }
};

/**
 * Called from workers to set the worker and master process user if it hasn't
 * already been set.
 */
let _switchedProcessUser = false;
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

/**
 * Called from a worker to execute the given function in only one worker.
 *
 * @param {string} id -  a unique identifier for the function to execute.
 * @param {Function} fn - The async function to execute.
 * @param {Object} [options={}] the options to use:
 *          [allowOnRestart] true to allow this function to execute again,
 *            but only once, on worker restart; this option is useful for
 *            behavior that persists but should only run in a single worker.
 *
 * @returns {Promise} Resolves when the operation completes.
 */
api.runOnce = async (id, fn, options = {}) => {
  const type = 'bedrock.runOnce';

  // notify master to schedule work (if not already scheduled/run)
  process.send({type, id, options});

  // wait for scheduling result
  let msg = await _waitForOneMessage({type, id});

  // work completed in another worker, finish
  if(msg.done) {
    if(msg.error) {
      throw errio.fromObject(msg.error, {stack: true});
    }
    return;
  }

  // run in this worker
  msg = {type, id, done: true};
  let error;
  try {
    await fn();
  } catch(e) {
    error = e;
    msg.error = cycle.decycle(errio.toObject(e, {stack: true}));
  }

  // notify other workers that work is complete
  process.send(msg);

  if(error) {
    throw error;
  }
};

/**
 * **DEPRECATED**: runOnceAsync() is deprecated. Use runOnce() instead.
 */
api.runOnceAsync = deprecate(
  api.runOnce, 'runOnceAsync() is deprecated. Use runOnce() instead.');

/**
 * Called from a worker to exit gracefully. Typically used by subcommands.
 */
api.exit = function() {
  cluster.worker.kill();
};

async function _waitForOneMessage({type, id}) {
  // get coordinated message from master
  return new Promise(resolve => {
    // listen to run function once
    process.on('message', _listenOnce);
    function _listenOnce(msg) {
      // ignore other messages
      if(!(_isMessageType(msg, type) && msg.id === id)) {
        return;
      }
      process.removeListener('message', _listenOnce);
      resolve(msg);
    }
  });
}

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
    const t = program.logTransports;
    const cats = t.split(',');
    cats.forEach(function(cat) {
      const catName = cat.split('=')[0];
      let catTransports;
      if(catName in config.loggers.categories) {
        catTransports = config.loggers.categories[catName];
      } else {
        catTransports = config.loggers.categories[catName] = [];
      }
      const transports = cat.split('=')[1].split(';');
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

function _setupUncaughtExceptionHandler(logger, logPrefix) {
  // log uncaught exception and exit, except in test mode
  if(config.cli.command.name() !== 'test') {
    process.on('uncaughtException', function(err) {
      process.removeAllListeners('uncaughtException');
      logger.critical(`${logPrefix} uncaught error`, {error: err});
      process.exit(1);
    });
  }
}

function _setupSignalHandler(logger, logPrefix) {
  const SIGNALS = {
    /*
      The SIGHUP (“hang-up”) signal is used to report that the
      user’s terminal is disconnected, perhaps because a network
      or telephone connection was broken.
    */
    SIGHUP: 1,
    /*
      The SIGINT (“program interrupt”) signal is sent
      when the user types the INTR character (normally C-c).
    */
    SIGINT: 2,
    /*
      The SIGTERM signal is a generic signal used to cause
      program termination. Unlike SIGKILL, this signal can
      be blocked, handled, and ignored. It is the normal way
      to politely ask a program to terminate.
    */
    SIGTERM: 15
  };

  Object.keys(SIGNALS).forEach(signal => {
    process.on(signal, async () => {
      logger.critical(`${logPrefix} received signal [${signal}].`);
      await events.emit('bedrock.exit');
      process.exit();
    });
  });
}

function _runMaster(startTime, options) {
  // FIXME: use child logger
  const logger = loggers.get('app');
  const logPrefix = '[bedrock/master]';

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
  const args = process.argv.slice(2).join(' ');
  process.title = config.core.master.title + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler(logger, logPrefix);
  _setupSignalHandler(logger, logPrefix);

  logger.info(
    `${logPrefix} starting process "${config.core.master.title}"`,
    {pid: process.pid});

  // get starting script
  const script = options.script || process.argv[1];

  // keep track of master state
  const masterState = {
    switchedUser: false,
    runOnce: {}
  };

  // notify workers to exit if master exits
  process.on('exit', function() {
    for(const id in cluster.workers) {
      cluster.workers[id].send({type: 'bedrock.core', message: 'exit'});
    }
  });

  // handle worker exit
  cluster.on('exit', function(worker, code, signal) {
    // if the worker called kill() or disconnect(), it was intentional, so exit
    // the process
    if(worker.exitedAfterDisconnect) {
      logger.info(
        `${logPrefix} worker "${worker.process.pid}" exited on purpose ` +
        `with code "${code}" and signal "${signal}"; exiting master process.`);
      process.exit(code);
    }

    // accidental worker exit (crash)
    logger.critical(
      `${logPrefix} worker "${worker.process.pid}" exited with code ` +
      `"${code}" and signal "${signal}".`);

    // if configured, fork a replacement worker
    if(config.core.worker.restart) {
      // clear any runOnce records w/allowOnRestart option set
      for(const id in masterState.runOnce) {
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
  const workers = config.core.workers;
  for(let i = 0; i < workers; ++i) {
    _startWorker(masterState, script);
  }
  logger.info(`${logPrefix} started`, {timeMs: Date.now() - startTime});
}

async function _runWorker(startTime) {
  // FIXME: use child logger
  const logger = loggers.get('app');
  const logPrefix = '[bedrock/worker]';

  // set 'ps' title
  const args = process.argv.slice(2).join(' ');
  process.title = config.core.worker.title + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler(logger, logPrefix);
  _setupSignalHandler(logger, logPrefix);

  logger.info(`${logPrefix} starting process "${config.core.worker.title}"`);

  // listen for master process exit
  let bedrockStarted = false;
  process.on('message', function(msg) {
    if(!_isMessageType(msg, 'bedrock.core') || msg.message !== 'exit') {
      return;
    }

    if(!bedrockStarted) {
      return events.emit('bedrock-cli.exit').finally(() => {
        process.exit();
      });
    }

    return events.emit('bedrock.stop').then(() => {
      return events.emit('bedrock-cli.exit').finally(() => {
        process.exit();
      });
    });
  });

  const cliReady = await events.emit('bedrock-cli.ready');
  // skip default behavior if cancelled (do not emit bedrock core events)
  // used for CLI commands
  if(cliReady === false) {
    return;
  }
  bedrockStarted = true;

  // snapshot the values of the fields that must be changed
  // during the `bedrock.configure` event
  let configOverrideSnapshot;
  if(config.ensureConfigOverride.enable) {
    configOverrideSnapshot = _snapshotOverrideFields({
      config,
      fields: config.ensureConfigOverride.fields,
    });
  }

  await events.emit('bedrock.configure');

  // ensure that the values captured in the snapshot have been changed
  if(configOverrideSnapshot) {
    // throws on failure which will prevent application startup
    _ensureConfigOverride({config, configOverrideSnapshot});
  }

  await events.emit('bedrock.admin.init');
  // set process user
  api.setProcessUser();
  await events.emit('bedrock.init');
  await events.emit('bedrock.start');
  await events.emit('bedrock.ready');
  await events.emit('bedrock.started');
  logger.info(`${logPrefix} started`, {timeMs: Date.now() - startTime});
}

function _startWorker(state, script) {
  const worker = cluster.fork();
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
      script
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

    const {type} = msg;

    if(msg.done) {
      state.runOnce[msg.id].done = true;
      state.runOnce[msg.id].error = msg.error || null;
      // notify workers to call callback
      const notify = state.runOnce[msg.id].notify;
      while(notify.length > 0) {
        const id = notify.shift();
        if(id in cluster.workers) {
          cluster.workers[id].send({
            type,
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
          type,
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
      notify: [],
      options: msg.options,
      done: false,
      error: null
    };
    worker.send({type, id: msg.id, done: false});
  });
}

function _isMessageType(msg, type) {
  return (typeof msg === 'object' && msg.type === type);
}

function _ensureConfigOverride({config, configOverrideSnapshot}) {
  const logger = loggers.get('app').child('bedrock/worker');
  logger.debug('Verifying configuration overrides.');
  for(const [key, value] of configOverrideSnapshot) {
    if(lodashGet(config, key) === value) {
      const error = new Error(
        `The config field "${key}" must be changed during the ` +
        '"bedrock.configuration" event.');
      logger.error(error);
      throw error;
    }
  }
  logger.debug('Configuration overrides have been verified.', {
    fields: [...configOverrideSnapshot.keys()]});
}

function _snapshotOverrideFields({config, fields}) {
  const snapshot = new Map();
  for(const field of fields) {
    snapshot.set(field, lodashGet(config, field));
  }
  return snapshot;
}
