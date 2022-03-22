/*!
 * Copyright (c) 2012-2021 Digital Bazaar, Inc. All rights reserved.
 */
import * as brUtil from './util.js';
import cluster from 'cluster';
import {config} from './config.js';
import cycle from 'cycle';
import {deprecate} from 'util';
import {emitter as events} from './events.js';
import errio from 'errio';
import {fileURLToPath} from 'url';
import lodashGet from 'lodash.get';
import {container as loggers} from './loggers/index.js';
import {cpus} from 'os';
import path from 'path';
import program from 'commander';
import {version} from '../package.json';
const {BedrockError} = brUtil;
const cc = brUtil.config.main.computer();

export {config, events, loggers, brUtil as util, version};

// calculate main program script (including worker case)
let main = process.main || process.mainModule;
if(main.filename.endsWith('/bedrock/lib/worker.cjs')) {
  // in this version, `children[0]` is `esm.js`, `children[1]` is `worker.js`
  let m = main.children[1].children[0];
  // if main was rewritten because of `esm.js` as well, use the module it loads
  if(m.filename.endsWith('/esm.js')) {
    m = main.children[1].children[1];
  }
  main = m;
}
export {main};

// set `__dirname` constant
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// primary process state
let WORKERS_EXITED;
const PRIMARY_STATE = {
  switchedUser: false,
  runOnce: {},
  workersExited: new Promise(resolve => {
    WORKERS_EXITED = resolve;
  })
};

// exiting state
let EXITING = false;

// worker bedrock started state
let BEDROCK_STARTED = false;

// register error class
errio.register(BedrockError);

// config paths
// configured here instead of config.js due to util dependency issues
// FIXME: v2.0.0: remove when removing warnings below.
// see: https://github.com/digitalbazaar/bedrock/issues/93
const _warningShown = {
  cache: false,
  log: false
};
cc({
  'paths.cache': () => {
    // FIXME: v2.0.0: remove warning and default and throw exception .
    // see: https://github.com/digitalbazaar/bedrock/issues/93
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
    // see: https://github.com/digitalbazaar/bedrock/issues/93
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
const _program = program.version(version);
export {_program as program};

/**
 * Starts the bedrock application.
 *
 * @param {object} [options={}] - The options to use:
 *   [script] the script to execute when forking bedrock workers, by
 *     default this will be process.argv[1].
 *
 * @returns {Promise} Resolves when the application has started or an error has
 *   occured.
 */
export async function start(options = {}) {
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
  await _loadConfigs();
  _configureLoggers();
  _configureWorkers();
  _configureProcess();
  await events.emit('bedrock-loggers.init');

  try {
    await loggers.init();
  } catch(err) {
    // can't log, quit
    console.error('Failed to initialize logging system:', err);
    await _exit(1);
  }
  // run
  if(cluster.isMaster) {
    _runPrimary(startTime, options);
    // don't emit `bedrock.error` in primary process
    return;
  }
  try {
    await _runWorker(startTime);
  } catch(err) {
    await events.emit('bedrock.error', err);
    throw err;
  }
}

/**
 * Called from workers to set the worker and primary process user if it hasn't
 * already been set.
 */
let _switchedProcessUser = false;
export function setProcessUser() {
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
  // send message to primary
  process.send({type: 'bedrock.switchProcessUser'}, _exitOnError);
}

/**
 * Called from a worker to execute the given function in only one worker.
 *
 * @param {string} id - A unique identifier for the function to execute.
 * @param {Function} fn - The async function to execute.
 * @param {object} [options={}] - The options to use:
 *   [allowOnRestart] true to allow this function to execute again,
 *     but only once, on worker restart; this option is useful for
 *     behavior that persists but should only run in a single worker.
 *
 * @returns {Promise} Resolves when the operation completes.
 */
export async function runOnce(id, fn, options = {}) {
  const type = 'bedrock.runOnce';

  // notify primary to schedule work (if not already scheduled/run)
  process.send({type, id, options}, _exitOnError);

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
  process.send(msg, _exitOnError);

  if(error) {
    throw error;
  }
}

/**
 * **DEPRECATED**: runOnceAsync() is deprecated. Use runOnce() instead.
 */
export const runOnceAsync = deprecate(
  runOnce, 'runOnceAsync() is deprecated. Use runOnce() instead.');

/**
 * Called from a worker to exit gracefully and without an error code. Typically
 * used by subcommands. Use `process.exit(1)` (or other error code) to exit
 * with an error code.
 */
export function exit() {
  cluster.worker.kill();
}

// export `default` for backwards compatibility
export default {
  config, events, loggers, util: brUtil, version, program: _program,
  start, setProcessUser, runOnce, runOnceAsync, exit, main
};

async function _waitForOneMessage({type, id}) {
  // get coordinated message from primary
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

async function _loadConfigs() {
  for(const cfg of program.config) {
    await import(path.resolve(process.cwd(), cfg));
  }
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
    config.core.workers = cpus().length;
  }
}

function _configureProcess() {
  // set no limit on event listeners
  process.setMaxListeners(Infinity);

  if(cluster.isMaster) {
    cluster.setupMaster({
      exec: path.join(__dirname, 'worker.cjs')
    });

    // set group before initializing loggers
    if(config.core.starting.groupId && process.setgid) {
      try {
        process.setgid(config.core.starting.groupId);
      } catch(ex) {
        console.warn('Failed to set primary starting gid: ' + ex);
      }
    }
    // set user before initializing loggers
    if(config.core.starting.userId && process.setuid) {
      try {
        process.setuid(config.core.starting.userId);
      } catch(ex) {
        console.warn('Failed to set primary starting uid: ' + ex);
      }
    }
  }
}

function _setupUncaughtExceptionHandler(logger, logPrefix) {
  // log uncaught exception and exit, except in test mode
  if(config.cli.command.name() !== 'test') {
    process.on('uncaughtException', async function(error) {
      process.removeAllListeners('uncaughtException');
      logger.critical(`${logPrefix} uncaught error`, {error});
      await _exit(1);
    });
  }
}

function _setupUnhandledRejectionHandler(logger, logPrefix) {
  // log uncaught exception and exit, except in test mode
  if(config.cli.command.name() !== 'test') {
    process.on('unhandledRejection', async function(error) {
      process.removeAllListeners('unhandledRejection');
      logger.critical(`${logPrefix} unhandled promise rejection`, {error});
      await _exit(1);
    });
  }
}

function _setupSignalHandler(logger, logPrefix) {
  const SIGNALS = {
    /*
      The SIGHUP ("hang-up") signal is used to report that the
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
    process.on(signal, async function exitProcess() {
      logger.info(`${logPrefix} received signal.`, {signal});
      await _exit();
    });
  });
}

function _runPrimary(startTime, options) {
  // FIXME: use child logger
  // see: https://github.com/digitalbazaar/bedrock/issues/90
  const logger = loggers.get('app');
  const logPrefix = '[bedrock/primary]';

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
  const args = process.argv.slice(2).join(' ');
  // TODO: Remove all use of config.core.master in next major release (5.x)
  // see: https://github.com/digitalbazaar/bedrock/issues/89
  const processTitle = config.core.master ?
    config.core.master.title : config.core.primary.title;
  process.title = processTitle + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler(logger, logPrefix);
  _setupUnhandledRejectionHandler(logger, logPrefix);
  _setupSignalHandler(logger, logPrefix);

  logger.info(
    `${logPrefix} starting process "${processTitle}"`,
    {pid: process.pid});

  // get starting script
  const script = options.script || process.argv[1];

  // if nothing else is scheduled on the event loop, attempt an orderly exit
  process.once('beforeExit', async function() {
    await _exit();
  });

  // handle worker exit
  cluster.on('exit', async function(worker, code, signal) {
    // if the worker called kill() or disconnect(), it was intentional, so exit
    // the process
    const shouldExit = worker.exitedAfterDisconnect;
    if(shouldExit) {
      logger.info(
        `${logPrefix} worker "${worker.process.pid}" exited on purpose ` +
        `with code "${code}" and signal "${signal}"; exiting primary process.`);
    } else {
      // accidental worker exit (crash)
      logger.critical(
        `${logPrefix} worker "${worker.process.pid}" exited with code ` +
        `"${code}" and signal "${signal}".`);
    }

    // if configured, fork a replacement worker
    if(!shouldExit && !EXITING && config.core.worker.restart) {
      // clear any runOnce records w/allowOnRestart option set
      for(const id in PRIMARY_STATE.runOnce) {
        if(PRIMARY_STATE.runOnce[id].worker === worker.id &&
          PRIMARY_STATE.runOnce[id].options.allowOnRestart) {
          delete PRIMARY_STATE.runOnce[id];
        }
      }
      _startWorker(script);
    } else {
      // if all workers have exited, resolve `WORKERS_EXITED`
      let allDead = true;
      for(const id in cluster.workers) {
        if(!cluster.workers[id].isDead()) {
          allDead = false;
          break;
        }
      }
      if(allDead) {
        WORKERS_EXITED();
      }
      // exit primary (will wait on `WORKERS_EXITED` if not all workers have
      // quit yet to allow an orderly exit)
      await _exit(code);
    }
  });

  // fork each app process
  const workers = config.core.workers;
  for(let i = 0; i < workers; ++i) {
    _startWorker(script);
  }
  logger.info(`${logPrefix} started`, {timeMs: Date.now() - startTime});
}

async function _runWorker(startTime) {
  // FIXME: use child logger
  // https://github.com/digitalbazaar/bedrock/issues/90
  const logger = loggers.get('app');
  const logPrefix = '[bedrock/worker]';

  // set 'ps' title
  const args = process.argv.slice(2).join(' ');
  process.title = config.core.worker.title + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler(logger, logPrefix);
  _setupUnhandledRejectionHandler(logger, logPrefix);
  _setupSignalHandler(logger, logPrefix);

  logger.info(`${logPrefix} starting process "${config.core.worker.title}"`);

  const cliReady = await events.emit('bedrock-cli.ready');
  // skip default behavior if cancelled (do not emit bedrock core events)
  // used for CLI commands
  if(cliReady === false) {
    return;
  }

  BEDROCK_STARTED = true;

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
  setProcessUser();
  await events.emit('bedrock.init');
  await events.emit('bedrock.start');
  await events.emit('bedrock.ready');
  await events.emit('bedrock.started');
  logger.info(`${logPrefix} started`, {timeMs: Date.now() - startTime});
}

function _startWorker(script) {
  const worker = cluster.fork();
  loggers.attach(worker);

  // listen to start requests from workers
  worker.once('online', function initWorker() {
    // notify worker to initialize and provide the cwd and script to run
    worker.send({
      type: 'bedrock.worker.init',
      cwd: process.cwd(),
      script
    }, err => {
      if(err) {
        // failure to send init message should hard terminate the worker
        worker.process.kill();
      }
    });
  });

  // if app process user hasn't been switched yet, wait for a message
  // from a worker indicating to do so
  if(!PRIMARY_STATE.switchedUser) {
    worker.on('message', switchProcessUserListener);
  }

  function switchProcessUserListener(msg) {
    if(!_isMessageType(msg, 'bedrock.switchProcessUser')) {
      return;
    }
    worker.removeListener('message', switchProcessUserListener);
    if(!PRIMARY_STATE.switchedUser) {
      PRIMARY_STATE.switchedUser = true;
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

  // listen to schedule run once functions; when this message is received, it
  // means a worker has asked the primary to schedule a function to run just
  // once on the first worker that requests it to be run, causing the others
  // to wait
  worker.on('message', function(msg) {
    if(!_isMessageType(msg, 'bedrock.runOnce')) {
      return;
    }

    const {type} = msg;

    if(msg.done) {
      PRIMARY_STATE.runOnce[msg.id].done = true;
      PRIMARY_STATE.runOnce[msg.id].error = msg.error || null;
      // notify workers to call callback
      const notify = PRIMARY_STATE.runOnce[msg.id].notify;
      while(notify.length > 0) {
        const id = notify.shift();
        if(id in cluster.workers) {
          cluster.workers[id].send({
            type,
            id: msg.id,
            done: true,
            error: msg.error
          }, _exitOnError);
        }
      }
      return;
    }

    if(msg.id in PRIMARY_STATE.runOnce) {
      if(PRIMARY_STATE.runOnce[msg.id].done) {
        // already ran, notify worker immediately
        worker.send({
          type,
          id: msg.id,
          done: true,
          error: PRIMARY_STATE.runOnce[msg.id].error
        }, _exitOnError);
      } else {
        // still running, add worker ID to notify queue for later notification
        PRIMARY_STATE.runOnce[msg.id].notify.push(worker.id);
      }
      return;
    }

    // run in this worker
    PRIMARY_STATE.runOnce[msg.id] = {
      worker: worker.id,
      notify: [],
      options: msg.options,
      done: false,
      error: null
    };
    worker.send({type, id: msg.id, done: false}, _exitOnError);
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

async function _preparePrimaryExit() {
  let allDead = true;
  for(const id in cluster.workers) {
    const worker = cluster.workers[id];
    if(!worker.isDead()) {
      // if any error occurs when telling the worker to terminate, hard
      // terminate it instead and ignore any errors that occur as a result
      // of that
      worker.once('error', () => {
        worker.once('error', () => {});
        worker.process.kill();
      });
      cluster.workers[id].kill();
      allDead = false;
    }
  }
  if(allDead) {
    // all workers are dead
    WORKERS_EXITED();
  }
}

async function _exit(code) {
  /* Notes on exiting:

  When the primary does an orderly exit, it must notify all workers
  to exit, wait for them to do so and then finally exit itself.

  When a worker does an orderly exit, it emits and awaits bedrock events based
  on the current state of the application and then exits. Upon exiting, a
  message will be sent to the primary with the exit status code.

  Regardless of whether a worker or the primary exit first, the primary will
  be notified of a worker exiting and it will decide whether or not to kill
  all workers and exit itself.

  If any worker or the primary are asked to exit while an orderly exit is in
  progress, this request will be ignored and the process will exit once the
  orderly exit completes. */

  // orderly exit already in progress
  if(EXITING) {
    return;
  }

  EXITING = true;

  try {
    if(cluster.isMaster) {
      await _preparePrimaryExit();
      await PRIMARY_STATE.workersExited;
    } else {
      // these events are only emitted in workers
      if(BEDROCK_STARTED) {
        await events.emit('bedrock.stop');
      }
      await events.emit('bedrock-cli.exit');
      await events.emit('bedrock.exit');
    }
  } finally {
    await _logExit(code);
    process.exit(code);
  }
}

async function _exitOnError(err) {
  if(err) {
    // a failure to send an IPC message is fatal, exit
    await _exit(1);
  }
}

async function _logExit(code = 0) {
  if(!cluster.isMaster) {
    return;
  }
  // log final message and wait for logger to flush
  const logger = loggers.get('app');
  const logPrefix = '[bedrock/primary]';
  try {
    const p = new Promise(resolve => {
      logger.info(
        `${logPrefix} primary process exiting with code "${code}".`, {code});
      logger.once('finish', () => resolve());
      logger.once('error', () => resolve());
      logger.end();
    });
    await p;
  } finally {}
}
