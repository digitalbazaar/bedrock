/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var config = {};
module.exports = config;

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

// master process while starting
config.core.starting = {};
// in production may want to use 'adm' group
config.core.starting.groupId = null;
config.core.starting.userId = null;

// master and workers after starting
config.core.running = {};
config.core.running.groupId = null;
config.core.running.userId = null;

// master process
config.core.master = {};
config.core.master.title = 'bedrock1d';

// worker processes
config.core.worker = {};
config.core.worker.restart = false;
config.core.worker.title = 'bedrock1d-worker';

// constants
config.constants = {};

/**
 * Cached JSON-LD contexts. This object maps context URLs to cached local
 * versions of contexts that will be loaded when using bedrock.jsonld's default
 * document loader.
 */
config.constants.CONTEXTS = {};

// jsonld
config.jsonld = {};
// FIXME: Change to true. Could break projects expecting a default of false.
config.jsonld.strictSSL = false;

// logging
config.loggers = {};

// transport for console logging
config.loggers.console = {};
config.loggers.console.level = 'debug';
config.loggers.console.silent = false;
config.loggers.console.json = false;
config.loggers.console.timestamp = true;
config.loggers.console.colorize = true;

// file transport for app logging
config.loggers.app = {};
config.loggers.app.level = 'debug';
config.loggers.app.silent = false;
config.loggers.app.json = false;
config.loggers.app.timestamp = true;
config.loggers.app.filename = '/tmp/bedrock-dev-app.log';
config.loggers.app.maxsize = 2 * 1024 * 1024;
config.loggers.app.maxFiles = 10;

// file transport for access logging
config.loggers.access = {};
config.loggers.access.level = 'debug';
config.loggers.access.silent = false;
config.loggers.access.json = false;
config.loggers.access.timestamp = true;
config.loggers.access.filename = '/tmp/bedrock-dev-access.log';
config.loggers.access.maxsize = 2 * 1024 * 1024;
config.loggers.access.maxFiles = 10;

// file transport for error logging
config.loggers.error = {};
config.loggers.error.level = 'error';
config.loggers.error.silent = false;
config.loggers.error.json = false;
config.loggers.error.timestamp = true;
config.loggers.error.filename = '/tmp/bedrock-dev-error.log';
config.loggers.error.maxsize = 2 * 1024 * 1024;
config.loggers.error.maxFiles = 10;

// transport for email logging
config.loggers.email = {};
config.loggers.email.level = 'critical';
config.loggers.email.to = ['cluster@localhost'];
config.loggers.email.from = 'cluster@localhost';
config.loggers.email.silent = true;
config.loggers.email.json = true;
config.loggers.email.timestamp = true;

// categories-transports map
config.loggers.categories = {
  app: ['console', 'app', 'error', 'email'],
  access: ['access', 'error']
};

// test config
config.test = {};
// list of available test frameworks
config.test.frameworks = [];
