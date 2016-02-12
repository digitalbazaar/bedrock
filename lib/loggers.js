/*
 * Copyright (c) 2012-2016 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var brUtil = require('./tools');
var cluster = require('cluster');
var config = require('./config');
var cycle = require('cycle');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var util = require('util');
var winston = require('winston');
var WinstonMail = require('winston-mail').Mail;

// posix isn't available on Windows, ignore it silently
try {
  var posix = require('posix');
} catch(e) {
  posix = null;
}

// create custom logging levels
var levels = {
  silly: 0,
  verbose: 1,
  debug: 2,
  info: 3,
  warning: 4,
  error: 5,
  critical: 6
};
var colors = {
  silly: 'cyan',
  verbose: 'blue',
  debug: 'blue',
  info: 'green',
  warning: 'yellow',
  error: 'red',
  critical: 'red'
};

// create the container for the master and all of the workers
var container = new winston.Container();
// override get to use a wrapper so loggers that are retrieved via `.get()`
// prior to logger initialization will receive the updated configuration
// when logging after initialization
container._get = container.get;
container._add = container.add;
container.get = container.add = function(id) {
  var existing = container.loggers[id];
  var logger = container._get.apply(container, arguments);
  if(!existing) {
    var wrapper = {};
    wrapper.__proto__ = logger;
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

/**
 * Initializes the logging system.
 *
 * @param callback(err) called once the operation completes.
 */
container.init = function(callback) {
  if(cluster.isMaster) {
    // create shared transports
    var transports = container.transports;
    transports.console = new winston.transports.Console(config.loggers.console);
    transports.app = new winston.transports.File(config.loggers.app);
    transports.access = new winston.transports.File(config.loggers.access);
    transports.error = new winston.transports.File(config.loggers.error);
    transports.email = new WinstonMail(config.loggers.email);

    // set unique names for file transports
    transports.app.name = 'app';
    transports.access.name = 'access';
    transports.error.name = 'error';

    async.waterfall([
      function(callback) {
        // ensure all files are created and have ownership set to the
        // application process user
        var filenames = Object.keys(config.loggers).filter(function(name) {
          return ('filename' in config.loggers[name]);
        }).map(function(name) {
          return config.loggers[name].filename;
        });
        async.each(filenames, function(filename, callback) {
          try {
            // make directory if needed
            mkdirp.mkdirp.sync(path.dirname(filename));
            var fd = fs.openSync(filename, 'a');
            if(config.core.running.userId) {
              var uid = config.core.running.userId;
              if(typeof uid !== 'number') {
                var user = null;
                if(posix) {
                  user = posix.getpwnam(uid);
                } else {
                  // on Windows, just get the current UID
                  user = {uid: process.getuid()};
                }
                if(!user) {
                  return callback(new Error(
                    'Unknown system user: "' + uid + '"'));
                }
                uid = user.uid;
              }
              if(process.getgid) {
                fs.fchownSync(fd, uid, process.getgid());
              }
            }
            fs.closeSync(fd);
          } catch(ex) {
            return callback(ex);
          }
          callback();
        }, callback);
      },
      function(callback) {
        // create master loggers
        for(var cat in config.loggers.categories) {
          var transportNames = config.loggers.categories[cat];
          var options = {transports: []};
          transportNames.forEach(function(name) {
            options.transports.push(transports[name]);
          });
          var logger = new winston.Logger(options);
          logger.setLevels(levels);
          if(container.loggers[cat]) {
            container.loggers[cat].__proto__ = logger;
          } else {
            var wrapper = {};
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

        callback();
      }
    ], callback);
    return;
  }

  // workers:

  // define transport that transmits log message to master logger
  var WorkerTransport = function(options) {
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
    var preformatted = null;
    if(brUtil.isObject(meta)) {
      preformatted = meta.preformatted;
      delete meta.preformatted;
    }
    // stringify and include the worker PID in the meta information
    var json;
    try {
      json = JSON.stringify(meta, null, 2);
    } catch(e) {
      json = JSON.stringify(cycle.decycle, null, 2);
    }
    var error;
    if(meta instanceof Error) {
      error = ('stack' in meta) ? meta.stack : meta;
      meta = {error: error, workerPid: process.pid};
    } else if(brUtil.isObject(meta) && 'error' in meta) {
      error = ('stack' in meta.error) ? meta.error.stack : meta.error;
      meta = {error: error, workerPid: process.pid};
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

    // send logger message to master
    process.send({
      type: 'bedrock.logger',
      level: level,
      msg: msg,
      meta: meta,
      category: this.category
    });
    this.emit('logged');
    callback(null, true);
  };

  // create worker loggers
  var lowestLevel = Object.keys(levels)[0];
  for(var cat in config.loggers.categories) {
    var logger = new winston.Logger({
      transports: [new WorkerTransport({level: lowestLevel, category: cat})]
    });
    logger.setLevels(levels);
    if(container.loggers[cat]) {
      container.loggers[cat].__proto__ = logger;
    } else {
      var wrapper = {};
      wrapper.__proto__ = logger;
      container.loggers[cat] = wrapper;
    }
  }

  // set the colors to use on the console
  winston.addColors(colors);

  callback();
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
