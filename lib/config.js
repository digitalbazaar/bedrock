// setup the config variable
var config = {};
module.exports = config;

// app info
config.app = {};
config.app.masterTitle = 'bedrock1d';
config.app.workerTitle = 'bedrock1d-worker';
config.app.restartWorkers = false;
config.app.user = {};
// system group and user IDs (can be groupname/username instead of numbers)
config.app.user.groupId = 'bedrock';
config.app.user.userId = 'bedrock';

// config environment
//config.environment = 'down';
config.environment = 'development';
//config.environment = 'testing';
//config.environment = 'sandbox';
//config.environment = 'production';

// modules to load
config.modules = [
  'mail',
  'database',
  'permission',
  'profile',
  'identity',
  'website'
];

// override module list for specific environments
config.envModules = {};
config.envModules.down = [
  'website'
];

// load application constants
require('../configs/constants');

// logger config
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
config.loggers.app.maxsize = 2*1024*1024;
config.loggers.app.maxFiles = 10;

// file transport for access logging
config.loggers.access = {};
config.loggers.access.level = 'debug';
config.loggers.access.silent = false;
config.loggers.access.json = false;
config.loggers.access.timestamp = true;
config.loggers.access.filename = '/tmp/bedrock-dev-access.log';
config.loggers.access.maxsize = 2*1024*1024;
config.loggers.access.maxFiles = 10;

// file transport for error logging
config.loggers.error = {};
config.loggers.error.level = 'error';
config.loggers.error.silent = false;
config.loggers.error.json = false;
config.loggers.error.timestamp = true;
config.loggers.error.filename = '/tmp/bedrock-dev-error.log';
config.loggers.error.maxsize = 2*1024*1024;
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

// server info
config.server = {};
config.server.workers = 1;
// 0 means use # of cpus
//config.server.workers = 0;
config.server.port = 18443;
config.server.httpPort = 18080;
config.server.bindAddr = ['bedrock.dev'];
config.server.domain = 'bedrock.dev';
config.server.host = config.server.domain;
if(config.server.port !== 443) {
  config.server.host += ':' + config.server.port;
}
config.server.baseUri = 'https://' + config.server.host;
config.server.key = __dirname + '/../pki/test-bedrock.key';
config.server.cert = __dirname + '/../pki/test-bedrock.crt';

// session info
config.server.session = {};
config.server.session.secret = '0123456789abcdef';
config.server.session.key = 'bedrock.sid';
config.server.session.prefix = 'bedrock.';
config.server.session.cookie = {};
config.server.session.cookie.secure = true;
// NOTE: 'connect' doesn't update the expires age for the cookie on every
//   request so sessions will always timeout on the client after the maxAge
//   time. Setting to null will cause sessions checks to only happen on the
//   server which does update the expires time on every request. The server
//   session maxAge is set below.
config.server.session.cookie.maxAge = null;

// server cache
config.server.cache = {};
config.server.cache.maxAge = 0;

// server static resource config
config.server.static = [];
config.server.staticOptions = {
  maxAge: config.server.cache.maxAge
};

// limiter config
config.limiter = {};
// redis config
config.limiter.host = 'localhost';
config.limiter.port = 6379;
config.limiter.options = {};
config.limiter.password = '';
// limit number of requests per hour per IP address (0 means no limit)
config.limiter.ipRequestsPerHour = 0;

// database config
config.database = {};
// mongodb config
config.database.name = 'bedrock_dev';
config.database.host = 'localhost';
config.database.port = 27017;
config.database.username = 'bedrock';
config.database.password = 'password';
config.database.adminPrompt = true;
config.database.options = {
  safe: true,
  j: true,
  native_parser: true
};
config.database.connectOptions = {
  auto_reconnect: true,
  socketOptions: {
    maxBsonSize: 1024 * 1024 * 16
  }
};
config.database.writeOptions = {
  safe: true,
  j: true,
  // FIXME: change to 2 for at least 1 replica
  w: 1,
  multi: true
};
config.database.session = {
  collection: 'session',
  // time in seconds to run db update to clear expired sessions
  clearInterval: 60 * 60,
  // 30 minute timeout on the server
  maxAge: 1000 * 60 * 30
};

// local database config
config.database.local = {};
config.database.local.name = 'local';
config.database.local.collection = 'bedrock_dev';
config.database.local.writeOptions = {
  safe: true,
  j: true,
  multi: true
};

// permission config
config.permission = {};
config.permission.roles = [];

// profile config
config.profile = {};
// base path for profile IDs
config.profile.basePath = '/profiles';
config.profile.defaults = {
  profile: {}
};
config.profile.profiles = [];

// identity config
config.identity = {};
// base path for identity IDs (appended to config.server.baseUri)
config.identity.basePath = '/i';
config.identity.defaults = {
  personal: {
    type: 'PersonalIdentity',
    sysPublic: [],
    address: [],
    preferences: {
      type: 'IdentityPreferences'
    }
  }
};
config.identity.defaults.identity = config.identity.defaults.personal;
config.identity.identities = [];
config.identity.keys = [];

// branding config
config.brand = {};
config.brand.name = 'Bedrock';

// website config
config.website = {};
config.website.i18nPaths = [
  __dirname + '/../site/static'
];
// add static paths for website
config.server.static.push(__dirname + '/../site/static');
config.server.static.push({
  route: '/requirejs/require.js',
  path: __dirname + '/../node_modules/requirejs/require.js',
  file: true
});
config.server.static.push({
  route: '/underscore/underscore.js',
  path: __dirname + '/../node_modules/underscore/underscore.js',
  file: true
});
config.server.static.push({
  route: '/promise/promise.js',
  path: __dirname + '/../node_modules/es6-promise/dist/promise-0.1.1.js',
  file: true
});

// the supported non-english languages for the site
config.website.locales = ['es', 'zh', 'ru', 'ja', 'de', 'fr'];
config.website.localePath = __dirname + '/../locales';
config.website.writeLocales = true;

// views config
config.website.views = {};
config.website.views.vars = {};
config.website.views.enableCache = false;
config.website.views.paths = [
  __dirname + '/../site/views'
];

// authentication config
// see config.server.session for session config
config.website.authentication = {};
config.website.authentication.httpSignature = {};
config.website.authentication.httpSignature.enabled = true;

// service sub modules
config.website.services = [
  'docs',
  'profile',
  'identity',
  'identifier',
  'key'
];

require('../configs/website');

// mail config
config.mail = {};
config.mail.events = [
  {
    type: 'common.Profile.created',
    // auth email
    template: 'common.Profile.created'
  },
  {
    type: 'common.Profile.created',
    // user email
    template: 'common.Profile.created-profile'
  },
  {
    type: 'common.Profile.passcodeSent',
    // user email
    template: 'common.Profile.passcodeSent'
  }
];
config.mail.templates = {};
config.mail.templates.enableCache = false;
config.mail.templates.path = __dirname + '/../../email-templates';
config.mail.templates.mappers = ['../../email-templates/mapper'];
config.mail.connection = {
  host: 'localhost',
  ssl: false
};
config.mail.send = false;
config.mail.vars = {};

// validation config
config.validation = {};
config.validation.schema = {};
config.validation.schema.paths = [__dirname + '/../schemas'];
config.validation.schema.skip = [];

// proxy config
config.proxy = {};
config.proxy.paths = [];
