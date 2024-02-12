/*!
 * Copyright (c) 2012-2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */
import * as brUtil from './util.js';
import {boolify, getByPath} from './helpers.js';
import cluster from 'node:cluster';
import {config} from './config.js';
import {container as loggers} from './loggers/index.js';
import {cpus} from 'node:os';
import {emitter as events} from './events.js';
import {fileURLToPath} from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import {program} from 'commander';
import {serializeError, deserializeError} from 'serialize-error';

// add primary aliases as needed
if(cluster.isPrimary === undefined) {
  cluster.isPrimary = cluster.isMaster;
}
if(cluster.setupPrimary === undefined) {
  cluster.setupPrimary = cluster.setupMaster;
}

const {BedrockError} = brUtil;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// read `package.json` version
const {version} = JSON.parse(fs.readFileSync(
  path.join(__dirname, '../package.json'), {encoding: 'utf8'}));

export {config, events, loggers, brUtil as util, version};

// calculate main program script if not already set; will already be set in
// workers; only gets set in primary
if(!global.bedrock) {
  // get starting script
  let script = process.argv[1];
  if(!script.endsWith('.js')) {
    script += script.endsWith('/') ? 'index.js' : '.js';
  }

  // set bedrock global
  global.bedrock = {main: {filename: script}, worker: null};
}
const {main} = global.bedrock;
export {main};

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
let BEDROCK_START_CALLED = false;

// expose bedrock program
const _program = program.version(version);
export {_program as program};

// reference to the default bedrock command
let _bedrockCommand;

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
  if(BEDROCK_START_CALLED) {
    throw new Error('"start" must not be called more than once.');
  }
  BEDROCK_START_CALLED = true;

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
      'Override console log timestamps config. (boolean)', boolify)
    .option('--log-colorize <colorize>',
      'Override console log colorization config. (boolean)', boolify)
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

  // set `bedrock` as the default command
  _bedrockCommand = program
    .command('bedrock', {isDefault: true})
    .description('Run the bedrock application (default).');

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
  if(cluster.isPrimary) {
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
      throw deserializeError(msg.error);
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
    msg.error = e instanceof BedrockError ? e.toObject() : serializeError(e);
  }

  // notify other workers that work is complete
  process.send(msg, _exitOnError);

  if(error) {
    throw error;
  }
}

/**
 * Called from a worker to exit gracefully and without an error code. Typically
 * used by subcommands. Use `process.exit(1)` (or other error code) to exit
 * with an error code.
 */
export function exit() {
  cluster.worker.kill();
}

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
    config.cli.command = _bedrockCommand;
  }
}

async function _loadConfigs() {
  const configs = program.opts().config;
  for(const cfg of configs) {
    await import(path.resolve(process.cwd(), cfg));
  }
}

function _configureLoggers() {
  const opts = program.opts();

  // set console log flags
  if('logLevel' in opts) {
    config.loggers.console.level = opts.logLevel;
  }
  if('logColorize' in opts) {
    config.loggers.console.colorize = opts.logColorize;
  }
  if('logTimestamps' in opts) {
    config.loggers.console.timestamp = opts.logTimestamps;
  }
  if('logExclude' in opts) {
    config.loggers.console.bedrock.excludeModules =
      opts.logExclude.split(',');
  }
  if('logOnly' in opts) {
    config.loggers.console.bedrock.onlyModules = opts.logOnly.split(',');
  }
  // adjust transports
  if('logTransports' in opts) {
    const t = opts.logTransports;
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
  if(opts.silent || opts.logLevel === 'none') {
    config.loggers.console.silent = true;
  }
}

function _configureWorkers() {
  const opts = program.opts();
  if('workers' in opts) {
    config.core.workers = opts.workers;
  }
  if(config.core.workers <= 0) {
    config.core.workers = cpus().length;
  }
}

function _configureProcess() {
  // set no limit on event listeners
  process.setMaxListeners(Infinity);

  if(cluster.isPrimary) {
    cluster.setupPrimary({exec: path.join(__dirname, 'worker.js')});

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

function _setupUncaughtExceptionHandler(logger) {
  // log uncaught exception and exit, except in test mode
  if(config.cli.command.name() !== 'test') {
    process.on('uncaughtException', async function(error) {
      process.removeAllListeners('uncaughtException');
      logger.critical('uncaught error', {error});
      await _exit(1);
    });
  }
}

function _setupUnhandledRejectionHandler(logger) {
  // log uncaught exception and exit, except in test mode
  if(config.cli.command.name() !== 'test') {
    process.on('unhandledRejection', async function(error) {
      process.removeAllListeners('unhandledRejection');
      logger.critical('unhandled promise rejection', {error});
      await _exit(1);
    });
  }
}

function _setupSignalHandler(logger) {
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
      logger.info('received signal.', {signal});
      await _exit();
    });
  });
}

function _runPrimary(startTime, options) {
  const logger = loggers.get('app').child('bedrock/primary');

  // setup cluster if running with istanbul coverage
  if(process.env.running_under_istanbul) {
    // re-call cover with no reporting and using pid named output
    cluster.setupPrimary({
      exec: './node_modules/.bin/istanbul',
      args: [
        'cover', '--report', 'none', '--print', 'none', '--include-pid',
        process.argv[1], '--'].concat(process.argv.slice(2))
    });
  }

  // set 'ps' title
  const args = process.argv.slice(2).join(' ');
  const processTitle = config.core.primary.title;
  process.title = processTitle + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler(logger);
  _setupUnhandledRejectionHandler(logger);
  _setupSignalHandler(logger);

  logger.info(`starting process "${processTitle}"`, {pid: process.pid});

  // get starting script
  let script = options.script || global.bedrock.main.filename;
  if(!script.endsWith('.js')) {
    if(script.endsWith('/')) {
      script += 'index.js';
    } else {
      script += '.js';
    }
  }

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
        `worker "${worker.process.pid}" exited on purpose ` +
        `with code "${code}" and signal "${signal}"; exiting primary process.`);
    } else {
      // accidental worker exit (crash)
      logger.critical(
        `worker "${worker.process.pid}" exited with code ` +
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
      _startWorker({script});
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
    _startWorker({script});
  }
  logger.info('started', {timeMs: Date.now() - startTime});
}

async function _runWorker(startTime) {
  const logger = loggers.get('app').child('bedrock/worker');

  // set 'ps' title
  const args = process.argv.slice(2).join(' ');
  process.title = config.core.worker.title + (args ? (' ' + args) : '');

  _setupUncaughtExceptionHandler(logger);
  _setupUnhandledRejectionHandler(logger);
  _setupSignalHandler(logger);

  logger.info(`starting process "${config.core.worker.title}"`);

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
  logger.info('started', {timeMs: Date.now() - startTime});
}

function _startWorker({script}) {
  const worker = cluster.fork();
  loggers.attach(worker);

  // listen to start requests from workers
  worker.on('message', function initWorker(msg) {
    if(!_isMessageType(msg, 'bedrock.worker.online')) {
      return;
    }
    worker.removeListener('message', initWorker);
    // notify worker to initialize and provide the cwd and script to run
    worker.send({
      type: 'bedrock.worker.init',
      cwd: process.cwd(),
      main: global.bedrock.main,
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
    if(getByPath(config, key) === value) {
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
    snapshot.set(field, getByPath(config, field));
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
    if(cluster.isPrimary) {
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
  if(!cluster.isPrimary) {
    return;
  }
  // log final message and wait for logger to flush
  const logger = loggers.get('app').child('bedrock/primary');
  try {
    const p = new Promise(resolve => {
      logger.info(`primary process exiting with code "${code}".`, {code});
      logger.once('finish', () => resolve());
      logger.once('error', () => resolve());
      logger.end();
    });
    await p;
  } finally {}
}
