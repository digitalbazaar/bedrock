var path = require('path');
var config = require('../lib/config');
module.exports = config;

// add test module
config.modules.push('test');
// add filesystem service module
config.modules.push('services.filesystem');

// app info
config.app.masterTitle = 'bedrock1d';
config.app.workerTitle = 'bedrock1d-worker';
config.app.restartWorkers = true;
// system group and user IDs (can be groupname/username instead of numbers)
config.app.user.groupId = process.getgid();
config.app.user.userId = process.getuid();

// config environment
config.environment = 'development';
//config.environment = 'testing';
//config.environment = 'sandbox';
//config.environment = 'production';

// logging
config.loggers.app.filename = '/tmp/bedrock-test-app.log';
config.loggers.access.filename = '/tmp/bedrock-test-access.log';
config.loggers.error.filename = '/tmp/bedrock-test-error.log';
config.loggers.email.silent = true;

// only log critical errors by default
config.loggers.console.level = 'critical';

// server info
// 0 means use # of cpus
config.server.workers = 0;
config.server.port = 18444;
config.server.httpPort = 18081;
config.server.bindAddr = ['bedrock.dev'];
config.server.domain = 'bedrock.dev';
config.server.host = 'bedrock.dev:18444';
config.server.baseUri = 'https://' + config.server.host;
config.server.key = __dirname + '/../pki/test-bedrock.key';
config.server.cert = __dirname + '/../pki/test-bedrock.crt';

// session info
config.server.session.secret = '0123456789abcdef';
config.server.session.key = 'bedrock.sid';
config.server.session.prefix = 'bedrock.';

// server static resource config
//config.server.static = [__dirname + '/../site/static'];
config.server.staticOptions = {
  maxAge: config.server.cache.maxAge
};

// database config
config.database.name = 'bedrock_test';
config.database.host = 'localhost';
config.database.port = 27017;
config.database.local.collection = 'bedrock_test';

// mail config
config.mail.connection = {
  host: 'localhost',
  ssl: false
};
config.mail.send = false;
config.mail.vars = {
  productionMode: config.website.views.vars.productionMode,
  serviceHost: config.server.host,
  serviceDomain: config.server.domain,
  supportDomain: config.server.domain,
  subjectPrefix: '[BEDROCK TEST] ',
  identitySubjectPrefix: '[BEDROCK TEST] ',
  serviceName: 'Bedrock Dev Test',
  machine: require('os').hostname()
};

// base URL for tests
config.website.views.vars.serviceHost = config.server.host;
config.website.views.vars.serviceDomain = config.server.domain;
config.website.views.vars.baseUri = config.server.baseUri;
config.website.views.vars.clientData.baseUri = config.server.baseUri;

config.test = {};
config.test.reporter = 'spec';
config.test.backend = {};
config.test.backend.tests = [
  path.resolve(__dirname, '..', 'tests', 'backend')
];
config.test.frontend = {};
config.test.frontend.configFile = path.resolve(
  __dirname, '..', 'protractor.conf.js');

require('./roles');
require('./common-data');
require('./dev-data');
