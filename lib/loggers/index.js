/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import * as fileLogger from './fileLogger.js';
import * as formatters from './formatters.js';
import cluster from 'cluster';
import {config} from '../config.js';
import crypto from 'crypto';
import {Mail as WinstonMail} from 'winston-mail';
import util from 'util';
import winston from 'winston';
import {WorkerTransport} from './WorkerTransport.js';

const randomBytes = util.promisify(crypto.randomBytes);

// create custom logging levels
const levels = {
  silly: 6,
  verbose: 5,
  debug: 4,
  info: 3,
  warning: 2,
  error: 1,
  critical: 0
};
const colors = {
  silly: 'cyan',
  verbose: 'blue',
  debug: 'blue',
  info: 'green',
  warning: 'yellow',
  error: 'red',
  critical: 'red'
};

// create the container for the primary and all of the workers
export const container = new winston.Container();
// override get to use a wrapper so loggers that are retrieved via `.get()`
// prior to logger initialization will receive the updated configuration
// when logging after initialization
container._add = container.add;
container.add = function(id) {
  const existing = container.has(id);
  let logger = container._add.apply(container, arguments);
  if(!existing) {
    const wrapper = Object.create(logger);
    wrapper.log = function(level, msg, ...meta) {
      // get default meta to ensure it is always applied
      const {defaultMeta} = this;
      // use `Object.getPrototypeOf` because the prototype may change
      // while the logging subsystem initializes
      const log = Object.getPrototypeOf(wrapper).log;

      if(arguments.length === 1) {
        return log.apply(wrapper, [level]);
      }

      meta[0] = {...defaultMeta, ...meta[0]};
      return log.apply(wrapper, [level, msg, ...meta]);
    };
    const createChild = wrapper.child;
    wrapper.child = function(childMeta) {
      // simple string name is shortcut for {module: name}
      if(typeof childMeta === 'string') {
        childMeta = {module: childMeta};
      }
      // create child logger from wrapper (merging child meta into parent meta)
      return createChild.apply(wrapper, [childMeta]);
    };
    logger = wrapper;
    container.loggers.set(id, wrapper);
  }
  return logger;
};

if(cluster.isMaster) {
  // reserved transports
  container.transports = {
    access: null,
    app: null,
    console: null,
    email: null,
    error: null,
  };
}

/**
 * Initializes the logging system.
 */
container.init = async () => {
  const workerId = await _generateWorkerId();

  if(cluster.isMaster) {
    // create shared transports
    const transports = container.transports;
    transports.console = new winston.transports.Console({
      ...config.loggers.console,
      format: formatters.fromConfig(config.loggers.console.bedrock),
    });
    transports.email = new WinstonMail(config.loggers.email);

    if(config.loggers.enableFileTransport) {
      await fileLogger.init({transports});
    }

    // create primary loggers
    for(const cat in config.loggers.categories) {
      const transportNames = config.loggers.categories[cat];
      const options = {levels, transports: []};
      transportNames.forEach(name => {
        // only use transports that have been initialized
        if(transports[name]) {
          options.transports.push(transports[name]);
        }
      });
      const logger = winston.createLogger(options);
      const _existingLogger = container.get(cat);
      if(_existingLogger) {
        _existingLogger.__proto__ = logger;
      } else {
        const wrapper = {};
        wrapper.__proto__ = logger;
        container.loggers.set(cat, wrapper);
      }
    }

    // set the colors to use on the console
    winston.addColors(colors);

    /**
     * Attaches a message handler to the given worker. This should be
     * called by the primary process to handle worker log messages.
     *
     * @param {object} worker - The worker to attach the message handler to.
     */
    container.attach = function(worker) {
      // set up message handler for primary process
      worker.on('message', function(msg) {
        if(typeof msg === 'object' && msg.type === 'bedrock.logger') {
          container.get(msg.category).log(msg.info);
        }
      });
    };

    return;
  }

  // create worker loggers
  const lowestLevel = Object.keys(levels)[0];
  for(const cat in config.loggers.categories) {
    const logger = winston.createLogger({
      levels,
      transports: [
        new WorkerTransport({level: lowestLevel, category: cat, workerId})
      ]
    });
    const _existingLogger = container.get(cat);
    if(_existingLogger) {
      _existingLogger.__proto__ = logger;
    } else {
      const wrapper = {};
      wrapper.__proto__ = logger;
      container.loggers.set(cat, wrapper);
    }
  }

  // set the colors to use on the console
  winston.addColors(colors);
};

/**
 * Adds a new transport. This must be called prior to `container.init` and
 * is a noop if the current process is not the primary process.
 *
 * @param {string} name - The name of the transport to add; if a name has
 *   already been taken, an error will be thrown.
 * @param {object} transport - The transport to add.
 */
container.addTransport = function(name, transport) {
  if(!cluster.isMaster) {
    return;
  }
  if(name in container.transports) {
    throw new Error(
      'Cannot add logger transport; the transport name "' + name +
      '" is already used.');
  }
  if(!('name' in transport)) {
    transport.name = name;
  }
  container.transports[name] = transport;
};

async function _generateWorkerId() {
  const buffer = await randomBytes(8);
  return buffer.toString('hex');
}
