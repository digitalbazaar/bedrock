var config = require('../lib/config');

// logging
config.loggers.app.filename = '/tmp/bedrock-test-app.log';
config.loggers.access.filename = '/tmp/bedrock-test-access.log';
config.loggers.error.filename = '/tmp/bedrock-test-error.log';
config.loggers.email.silent = true;

// only log critical errors by default
config.loggers.console.level = 'critical';

// server info
config.server.port = 18444;
config.server.httpPort = 18081;
config.server.host = 'bedrock.dev:18444';
config.server.baseUri = 'https://' + config.server.host;

// mongodb config
config.mongodb.name = 'bedrock_test';
config.mongodb.local.collection = 'bedrock_test';

// mail config
config.mail.vars = {
  productionMode: config.views.vars.productionMode,
  baseUri: config.server.baseUri,
  subject: {
    prefix: '[Bedrock TEST] ',
    identityPrefix: '[Bedrock TEST] '
  },
  service: {
    name: 'Bedrock Dev Test',
    host: config.server.host
  },
  system: {
    name: 'System',
    email: 'cluster@' + config.server.domain
  },
  support: {
    name: 'Customer Support',
    email: 'support@' + config.server.domain
  },
  registration: {
    email: 'registration@' + config.server.domain
  },
  comments: {
    email: 'comments@' + config.server.domain
  },
  machine: require('os').hostname()
};

// base URL for tests
config.views.vars.serviceHost = config.server.host;
config.views.vars.serviceDomain = config.server.domain;
config.views.vars.baseUri = config.server.baseUri;
config.views.vars.clientData.baseUri = config.server.baseUri;

require('./roles');
require('./common-data');
require('./dev-data');
