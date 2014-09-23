/*
 * Example configuration.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('bedrock').config;
module.exports = config;

// location of configuration files
var _cfgdir = __dirname + '/..';

// location of static resources
var _datadir = __dirname + '/..';

// location of logs
var _logdir = _datadir + '/logs/';

// modules to load
config.modules = [
  'website',
  'gui'
];

// website service sub modules to load
config.website.services = [
  'proxy'
];

// config environment
config.environment = 'development';

// app info
config.app.masterTitle = 'example1d';
config.app.workerTitle = 'example1d-worker';
config.app.restartWorkers = false;

// logging
config.loggers.logdir = _logdir;
config.loggers.app.filename = _logdir + '/example-app.log';
config.loggers.access.filename = _logdir + '/example-access.log';
config.loggers.error.filename = _logdir + '/example-error.log';
config.loggers.email.silent = false;

// server info
// 0 means use # of cpus
config.server.workers = 1;
config.server.port = 8002;
config.server.httpPort = 8001;
config.server.bindAddr = ['localhost'];
config.server.domain = 'localhost';
config.server.host = 'localhost';
config.server.baseUri = 
  'https://' + config.server.host + ':' + config.server.port + '/';
config.server.key = _cfgdir + '/pki/example.key';
config.server.cert = _cfgdir + '/pki/example.crt';

// session info
config.server.session.secret = 'NOT_A_SECRET_123456789';
config.server.session.key = 'example.sid';
config.server.session.prefix = 'example.';

// server static resource config
config.server.staticOptions = {
  maxAge: config.server.cache.maxAge
};

// branding
config.brand.name = 'example';

// add static paths for website
config.website.i18nPaths = [
  _datadir + '/site/static'
];
config.server.static.push(_datadir + '/site/static');

config.website.views.paths.push(_datadir + '/site/views');
config.website.views.cache = false;

// turn off locale file updates
config.website.writeLocales = false;

config.website.views.vars.productionMode = false;
// 'minify' setting used in non-production mode
config.website.views.vars.minify = false;

config.website.views.vars.baseUri = config.server.baseUri;
config.website.views.vars.serviceHost = config.server.host;
config.website.views.vars.serviceDomain = config.server.domain;
config.website.views.vars.supportDomain = 'example.com';

// FIXME: add logo img
config.website.views.vars.style.brand.src = null;//'/img/example.png';
//config.website.views.vars.style.brand.alt = config.brand.name;
//config.website.views.vars.style.brand.height = '24';
//config.website.views.vars.style.brand.width = '25';

config.website.views.vars.title = config.brand.name;
config.website.views.vars.siteTitle = config.brand.name;

config.website.views.vars.debug = false;

var clientData = config.website.views.vars.clientData;
clientData.siteTitle = config.brand.name;
clientData.productionMode = false;

config.proxy.paths = [{
  route: '/api/*',
  options: {
    target: 'https://api.example.com/',
    secure: false
  }
}];
