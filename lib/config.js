/*!
 * Copyright (c) 2012-2021 Digital Bazaar, Inc. All rights reserved.
 */
export const config = {};

// cli info
config.cli = {};
config.cli.command = null;

// core
config.core = {};

// 0 means use # of cpus
config.core.workers = 1;

// error options
config.core.errors = {};
// include a stack trace in errors
config.core.errors.showStack = true;

// group and user IDs:
// - set if not null if system supports system calls
// - IDs can be numeric or string names

// primary process while starting
config.core.starting = {};
// in production may want to use 'adm' group
config.core.starting.groupId = null;
config.core.starting.userId = null;

// primary and workers after starting
config.core.running = {};
config.core.running.groupId = null;
config.core.running.userId = null;

// primary process
config.core.primary = {};
config.core.primary.title = 'bedrock1d';
// TODO: Remove in next major release (5.x)
// see: https://github.com/digitalbazaar/bedrock/issues/89
config.core.master = {};

// worker processes
config.core.worker = {};
config.core.worker.restart = false;
config.core.worker.title = 'bedrock1d-worker';

// constants
config.constants = {};

// common paths
config.paths = {
  // note: defaults configured in bedrock.js to fail.
  // applications MUST set these if used
  cache: null,
  log: null
};

config.ensureConfigOverride = {};
// enable this feature when configuration overrides must occur during startup
config.ensureConfigOverride.enable = false;
// an array of path strings (e.g. 'mongodb.host', 'session-mongodb.ttl')
config.ensureConfigOverride.fields = [];

/* logging options
 * formatter options:
 *  default, json, logstash or a custom formatter function
 */
config.loggers = {};

// set to false to disable all file based logging
config.loggers.enableFileTransport = true;

// transport for console logging
config.loggers.console = {};

config.loggers.console.level = 'debug';
config.loggers.console.silent = false;
// bedrock options
config.loggers.console.bedrock = {};
config.loggers.console.bedrock.formatter = 'default';
config.loggers.console.bedrock.colorize = true;
config.loggers.console.bedrock.onlyModules = false;
config.loggers.console.bedrock.excludeModules = false;

// file transport for app logging
config.loggers.app = {};
config.loggers.app.level = 'debug';
config.loggers.app.silent = false;
// note: configured in loggers.js as path.join(config.paths.log, 'app.log')
config.loggers.app.filename = null;
config.loggers.app.maxsize = 2 * 1024 * 1024;
config.loggers.app.maxFiles = 10;
config.loggers.app.tailable = true;
// bedrock options
config.loggers.app.bedrock = {};
config.loggers.app.bedrock.formatter = 'default';
config.loggers.app.bedrock.colorize = false;
// chown the logging dir to bedrock.config.core.running.userId
config.loggers.app.bedrock.enableChownDir = false;

// file transport for access logging
config.loggers.access = {};

config.loggers.access.level = 'debug';
config.loggers.access.silent = false;
// note: configured in loggers.js as path.join(config.paths.log, 'access.log')
config.loggers.access.filename = null;
config.loggers.access.maxsize = 2 * 1024 * 1024;
config.loggers.access.maxFiles = 10;
config.loggers.access.tailable = true;
// bedrock options
config.loggers.access.bedrock = {};
config.loggers.access.bedrock.formatter = 'default';
config.loggers.access.bedrock.colorize = false;
// chown the logging dir to bedrock.config.core.running.userId
config.loggers.access.bedrock.enableChownDir = false;

// file transport for error logging
config.loggers.error = {};
config.loggers.error.level = 'error';
config.loggers.error.silent = false;

// note: configured in loggers.js as path.join(config.paths.log, 'error.log')
config.loggers.error.filename = null;
config.loggers.error.maxsize = 2 * 1024 * 1024;
config.loggers.error.maxFiles = 10;
config.loggers.error.tailable = true;
// bedrock options
config.loggers.error.bedrock = {};
config.loggers.error.bedrock.formatter = 'default';
config.loggers.error.bedrock.colorize = false;
// chown the logging dir to bedrock.config.core.running.userId
config.loggers.error.bedrock.enableChownDir = false;

// transport for email logging
config.loggers.email = {};
config.loggers.email.level = 'critical';
config.loggers.email.to = ['cluster@localhost'];
config.loggers.email.from = 'cluster@localhost';
config.loggers.email.silent = true;
config.loggers.email.json = true;
config.loggers.email.timestamp = true;
// bedrock options
config.loggers.email.bedrock = {};

// categories-transports map
config.loggers.categories = {
  app: ['console', 'app', 'error', 'email'],
  access: ['access', 'error']
};
