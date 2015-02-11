var config = require('../lib/config');

// config environment
config.environment = 'development';

// logging
config.loggers.app.filename = '/tmp/bedrock-dev-app.log';
config.loggers.access.filename = '/tmp/bedrock-dev-access.log';
config.loggers.error.filename = '/tmp/bedrock-dev-error.log';
config.loggers.email.silent = true;
