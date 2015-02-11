var config = require('../lib/config');

// config environment
config.environment = 'testing';

// logging
config.loggers.app.filename = '/tmp/bedrock-test-app.log';
config.loggers.access.filename = '/tmp/bedrock-test-access.log';
config.loggers.error.filename = '/tmp/bedrock-test-error.log';
config.loggers.email.silent = true;

// only log critical errors by default
config.loggers.console.level = 'critical';
