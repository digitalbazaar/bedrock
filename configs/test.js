var path = require('path');
__libdir = process.env.BEDROCK_COV ?
  path.resolve(__dirname, '../lib-cov') :
  path.resolve(__dirname, '../lib');
var config = require(__libdir + '/config');
module.exports = config;

// add test module
config.modules.push('test');

// app info
config.app.masterTitle = 'bedrock1d';
config.app.workerTitle = 'bedrock1d-worker';
config.app.restartWorkers = true;
// system group and user IDs (can be groupname/username instead of numbers)
config.app.user.groupId = process.getuid();
config.app.user.userId = process.getgid();

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

// only log emergency errors by default
config.loggers.console.level = 'emergency';

// server info
// 0 means use # of cpus
config.server.workers = 0;
config.server.port = 18443;
config.server.httpPort = 18080;
config.server.bindAddr = ['bedrock.dev'];
config.server.domain = 'bedrock.dev';
config.server.host = 'bedrock.dev:18443';
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
  profileSubjectPrefix: '[BEDROCK TEST] ',
  serviceName: 'Bedrock Dev Test',
  machine: require('os').hostname()
};


// base URL for tests
config.website.baseUrl = 'https://bedrock.dev:18443/';

config.tests = {};
config.tests.unit = [
  path.resolve(__dirname, '..', 'tests', 'unit')
];
config.tests.system = [
  path.resolve(__dirname, '..', 'tests', 'system')
];

require('./roles');
require('./common-data');
require('./dev-data');
