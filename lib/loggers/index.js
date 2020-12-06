/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const brUtil = require('../util');
const cc = brUtil.config.main.computer();
const cluster = require('cluster');
const config = require('../config');
const crypto = require('crypto');
const formatters = require('./formatters');
const fs = require('fs').promises;
const path = require('path');
const uidNumber = require('uid-number');
const util = require('util');
const winston = require('winston');
const WinstonMail = require('winston-mail').Mail;
const WorkerTransport = require('./WorkerTransport');

const randomBytes = util.promisify(crypto.randomBytes);

// config filenames
// configured here instead of config.js due to util dependency issues
cc({
  'loggers.app.filename': () => path.join(config.paths.log, 'app.log'),
  'loggers.access.filename': () => path.join(config.paths.log, 'access.log'),
  'loggers.error.filename': () => path.join(config.paths.log, 'error.log')
});

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

// create the container for the master and all of the workers
const container = new winston.Container();
// override get to use a wrapper so loggers that are retrieved via `.get()`
// prior to logger initialization will receive the updated configuration
// when logging after initialization
// container._get = container.get;
container._add = container.add;
container.add = function(id) {
  const existing = container.has(id);
  let logger = container._add.apply(container, arguments);
  if(!existing) {
    const wrapper = Object.create(logger);
    wrapper.log = function(level, msg, ...meta) {
      if(arguments.length === 1) {
        return Object.getPrototypeOf(wrapper).log.apply(
          wrapper, [level]);
      }
      return Object.getPrototypeOf(wrapper).log.apply(
        wrapper, [level, msg, ...meta]);
    };
    wrapper.child = function(childMeta) {
      // simple string name is shortcut for {module: name}
      if(typeof childMeta === 'string') {
        childMeta = {module: childMeta};
      }
      // create child logger with merged meta data from parent
      const child = Object.create(this);
      child.defaultMeta = {...this.defaultMeta, ...childMeta};
      return child;
    };
    logger = wrapper;
    container.loggers.set(id, wrapper);
  }
  return logger;
};
module.exports = container;

if(cluster.isMaster) {
  // reserved transports
  container.transports = {
    console: true,
    app: true,
    access: true,
    error: true,
    email: true
  };
}

async function chown(filename) {
  if(config.core.running.userId) {
    let uid = config.core.running.userId;
    if(typeof uid !== 'number') {
      if(process.platform === 'win32') {
        // on Windows, just get the current UID
        uid = process.getuid();
      } else {
        try {
          let gid;
          /* eslint-disable-next-line no-unused-vars */
          [uid, gid] = await new Promise((resolve, reject) => {
            uidNumber(uid, (err, uid, gid) => {
              if(err) {
                reject(err);
                return;
              }
              resolve([uid, gid]);
            });
          });
        } catch(e) {
          throw new brUtil.BedrockError(
            `Unable to convert user "${uid}" to a numeric user id. ` +
            'Try using a uid number instead.',
            'Error', {cause: e});
        }
      }
    }
    if(process.getgid) {
      await fs.chown(filename, uid, process.getgid());
    }
  }
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
    transports.app = new winston.transports.File({
      ...config.loggers.app,
      format: formatters.fromConfig(config.loggers.app.bedrock),
    });
    transports.access = new winston.transports.File({
      ...config.loggers.access,
      format: formatters.fromConfig(config.loggers.access.bedrock),
    });
    transports.error = new winston.transports.File({
      ...config.loggers.error,
      format: formatters.fromConfig(config.loggers.error.bedrock),
    });
    transports.email = new WinstonMail(config.loggers.email);

    // set unique names for file transports
    transports.app.name = 'app';
    transports.access.name = 'access';
    transports.error.name = 'error';

    // ensure all files are created and have ownership set to the
    // application process user
    const fileLoggers = Object.keys(config.loggers).filter(function(name) {
      const logger = config.loggers[name];
      return (brUtil.isObject(logger) && 'filename' in logger);
    }).map(function(name) {
      return config.loggers[name];
    });
    // TODO: run in parallel
    for(const fileLogger of fileLoggers) {
      const dirname = path.dirname(fileLogger.filename);
      // make directory and chown if requested
      await fs.mkdir(dirname, {recursive: true});
      if('bedrock' in fileLogger && fileLogger.bedrock.enableChownDir) {
        await chown(dirname);
      }
      // check file can be opened
      const f = await fs.open(fileLogger.filename, 'a');
      await f.close();
      // always chown log file
      await chown(fileLogger.filename);
    }

    // create master loggers
    for(const cat in config.loggers.categories) {
      const transportNames = config.loggers.categories[cat];
      const options = {levels, transports: []};
      transportNames.forEach(function(name) {
        options.transports.push(transports[name]);
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
     * called by the master process to handle worker log messages.
     *
     * @param worker the worker to attach the message handler to.
     */
    container.attach = function(worker) {
      // set up message handler for master process
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
    const logger = new winston.createLogger({
      transports: [
        new WorkerTransport({
          level: lowestLevel, levels, category: cat, workerId})
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
 * is a noop if the current process is not the master process.
 *
 * @param name the name of the transport to add; if a name has already been
 *          taken, an error will be thrown.
 * @param transport the transport to add.
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
