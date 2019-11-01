/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const brUtil = require('./util');
const cc = brUtil.config.main.computer();
const cluster = require('cluster');
const config = require('./config');
const cycle = require('cycle');
const fs = require('fs').promises;
const path = require('path');
const util = require('util');
const winston = require('winston');
const WinstonMail = require('winston-mail').Mail;

// posix isn't available on Windows, ignore it silently
let posix;
try {
  posix = require('posix');
} catch(e) {
  posix = null;
}

// config filenames
// configured here instead of config.js due to util dependency issues
cc({
  'loggers.app.filename': () => path.join(config.paths.log, 'app.log'),
  'loggers.access.filename': () => path.join(config.paths.log, 'access.log'),
  'loggers.error.filename': () => path.join(config.paths.log, 'error.log')
});

// create custom logging levels
const levels = {
  silly: 0,
  verbose: 1,
  debug: 2,
  info: 3,
  warning: 4,
  error: 5,
  critical: 6
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
container._get = container.get;
container._add = container.add;
container.get = container.add = function(id) {
  const existing = container.loggers[id];
  let logger = container._get.apply(container, arguments);
  if(!existing) {
    const wrapper = Object.create(logger);
    wrapper.log = function(level, msg, meta) {
      // merge per-logger and per-log meta and call parent logger
      meta = Object.assign({}, this.meta, meta);
      return Object.getPrototypeOf(wrapper).log.apply(
        wrapper, [level, msg, meta]);
    };
    wrapper.child = function(childMeta) {
      // simple string name is shortcut for {module: name}
      if(typeof childMeta === 'string') {
        childMeta = {module: childMeta};
      }
      // create child logger with merged meta data from parent
      const child = Object.create(this);
      child.meta = Object.assign({}, this.meta, childMeta);
      child.setLevels(levels);
      return child;
    };
    logger = container.loggers[id] = wrapper;
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
      let user = null;
      if(posix) {
        user = posix.getpwnam(uid);
      } else if(process.platform === 'win32') {
        // on Windows, just get the current UID
        user = {uid: process.getuid()};
      }
      if(!user && !posix && typeof uid !== 'number') {
        throw new Error(
          '"posix" package not available to convert user "' + uid + '" ' +
          'to a number. Try using a uid number instead.');
      }
      if(!user) {
        throw new Error('No system user id for "' + uid + '".');
      }
      uid = user.uid;
    }
    if(process.getgid) {
      await fs.chown(filename, uid, process.getgid());
    }
  }
}

// class to handle pretty printing module name
class ModuleConsoleTransport extends winston.transports.Console {
  constructor(config) {
    super(config);
    this.modulePrefix = config.bedrock.modulePrefix;
    this.onlyModules = config.bedrock.onlyModules;
    this.excludeModules = config.bedrock.excludeModules;
  }
  log(level, msg, meta, callback) {
    // only output messages from modules specified by --log-only
    if(this.onlyModules && this.modulePrefix &&
      'module' in meta && !this.onlyModules.includes(meta.module)) {
      return;
    }
    // do not output messages from modules specified by --log-exclude
    if(this.excludeModules && this.modulePrefix &&
      'module' in meta && this.excludeModules.includes(meta.module)) {
      return;
    }
    if(this.modulePrefix && 'module' in meta) {
      // add pretty module prefix
      msg = '[' + meta.module + '] ' + msg;
      // copy to avoid changing shared original
      meta = Object.assign({}, meta);
      // remove module so not re-printed as details
      delete meta.module;
    }
    super.log(level, msg, meta, callback);
  }
}

// class to handle pretty printing module name
class ModuleFileTransport extends winston.transports.File {
  constructor(config) {
    super(config);
    this.modulePrefix = config.bedrock.modulePrefix;
  }
  log(level, msg, meta, callback) {
    if(this.modulePrefix && 'module' in meta) {
      // add pretty module prefix
      msg = '[' + meta.module + '] ' + msg;
      // copy to avoid changing shared original
      meta = Object.assign({}, meta);
      // remove module so not re-printed as details
      delete meta.module;
    }
    super.log(level, msg, meta, callback);
  }
}

/**
 * Initializes the logging system.
 */
container.init = async () => {
  if(cluster.isMaster) {
    // create shared transports
    const transports = container.transports;
    transports.console = new ModuleConsoleTransport(config.loggers.console);
    transports.app = new ModuleFileTransport(config.loggers.app);
    transports.access = new ModuleFileTransport(config.loggers.access);
    transports.error = new ModuleFileTransport(config.loggers.error);
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
      const options = {transports: []};
      transportNames.forEach(function(name) {
        options.transports.push(transports[name]);
      });
      const logger = new winston.Logger(options);
      logger.setLevels(levels);
      if(container.loggers[cat]) {
        container.loggers[cat].__proto__ = logger;
      } else {
        const wrapper = {};
        wrapper.__proto__ = logger;
        container.loggers[cat] = wrapper;
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
          container.get(msg.category).log(msg.level, msg.msg, msg.meta);
        }
      });
    };

    return;
  }

  // workers:

  // define transport that transmits log message to master logger
  const WorkerTransport = function(options) {
    winston.Transport.call(this, options);
    this.category = options.category;
  };
  util.inherits(WorkerTransport, winston.Transport);
  WorkerTransport.prototype.name = 'worker';
  WorkerTransport.prototype.log = function(level, msg, meta, callback) {
    if(this.silent) {
      return callback(null, true);
    }

    // FIXME: rework this error handling and callers
    // Add support for BedrockError and its toObject() feature.

    // pull out any meta values that are pre-formatted
    meta = meta || {};
    let preformatted = null;
    const metaIsObject = brUtil.isObject(meta);
    let module = null;
    if(metaIsObject) {
      if('preformatted' in meta) {
        preformatted = meta.preformatted;
        delete meta.preformatted;
      }
      if('module' in meta) {
        module = meta.module;
        delete meta.module;
      }
    }
    // stringify and include the worker PID in the meta information
    let json;
    try {
      json = JSON.stringify(meta, null, 2);
    } catch(e) {
      json = JSON.stringify(cycle.decycle(meta), null, 2);
    }
    let error;
    if(meta instanceof Error) {
      error = ('stack' in meta) ? meta.stack : meta;
      meta = {error, workerPid: process.pid};
    } else if(metaIsObject && 'error' in meta) {
      error = ('stack' in meta.error) ? meta.error.stack : meta.error;
      meta = {error, workerPid: process.pid};
    } else {
      meta = {workerPid: process.pid};
    }

    // only add details if they exist
    if(json !== '{}') {
      meta.details = json;
    }

    // only add pre-formatted entries if they exist
    if(preformatted) {
      meta.preformatted = preformatted;
    }

    // only add module if it was specified
    if(module) {
      meta.module = module;
    }

    // send logger message to master
    process.send({
      type: 'bedrock.logger',
      level,
      msg,
      meta,
      category: this.category
    });
    this.emit('logged');
    callback(null, true);
  };

  // create worker loggers
  const lowestLevel = Object.keys(levels)[0];
  for(const cat in config.loggers.categories) {
    const logger = new winston.Logger({
      transports: [new WorkerTransport({level: lowestLevel, category: cat})]
    });
    logger.setLevels(levels);
    if(container.loggers[cat]) {
      container.loggers[cat].__proto__ = logger;
    } else {
      const wrapper = {};
      wrapper.__proto__ = logger;
      container.loggers[cat] = wrapper;
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
