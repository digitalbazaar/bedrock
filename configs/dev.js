var path = require('path');
var config = require('../lib/config');

// app info
// 0 means use # of cpus
config.app.workers = 1;
config.app.masterTitle = 'bedrock1d';
config.app.workerTitle = 'bedrock1d-worker';
config.app.restartWorkers = false;

// system group and user IDs (can be groupname/username instead of numbers)
if(process.platform !== 'win32') {
  config.app.user.groupId = process.getgid();
  config.app.user.userId = process.getuid();
} else {
  config.app.user.groupId = 0;
  config.app.user.userId = 0;
}

// config environment
config.environment = 'development';
//config.environment = 'testing';
//config.environment = 'sandbox';
//config.environment = 'production';

// logging
config.loggers.app.filename = '/tmp/bedrock-dev-app.log';
config.loggers.access.filename = '/tmp/bedrock-dev-access.log';
config.loggers.error.filename = '/tmp/bedrock-dev-error.log';
config.loggers.email.silent = true;

// server info
config.server.port = 18443;
config.server.httpPort = 18080;
config.server.bindAddr = ['bedrock.dev'];
config.server.domain = 'bedrock.dev';
config.server.host = 'bedrock.dev:18443';
config.server.baseUri = 'https://' + config.server.host;
config.server.key = path.join(__dirname, '..', 'pki', 'test-bedrock.key');
config.server.cert = path.join(__dirname, '..', 'pki', 'test-bedrock.crt');

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
config.database.name = 'bedrock_dev';
config.database.host = 'localhost';
config.database.port = 27017;
config.database.local.collection = 'bedrock_dev';

// mail config
config.mail.connection = {
  host: 'localhost',
  ssl: false
};
config.mail.send = false;
config.mail.vars = {
  productionMode: config.website.views.vars.productionMode,
  baseUri: config.server.baseUri,
  subject: {
    prefix: '[Bedrock DEV] ',
    identityPrefix: '[Bedrock DEV] '
  },
  service: {
    name: 'Bedrock Development',
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

require('./roles');
require('./common-data');
require('./dev-data');
