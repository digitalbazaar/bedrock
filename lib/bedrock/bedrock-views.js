/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
// TODO : require('bedrock') instead
var bedrock = {
  config: require('../config'),
  events: require('./events'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var path = require('path');
var swigcore = require('swig');
var swigLoaders = require('./swig.loaders');
var uaParser = require('ua-parser');
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.website';

// module API
var api = {};
module.exports = api;

/**
 * Gets a copy of the default view variables.
 *
 * @param req the current request.
 * @param callback(err, vars) called once the operation completes.
 */
api.getDefaultViewVars = function(req, callback) {
  var vars = bedrock.tools.clone(bedrock.config.website.views.vars);

  // include browser user agent
  vars.userAgent = req.userAgent;

  // converts a var to json for later JSON.parse() via a page script
  vars.parsify = function(v) {
    return "JSON.parse('" + JSON.stringify(v)
      .replace(/\\n/g, '\\\\n')
      .replace(/\\r/g, '\\\\r')
      .replace(/\"/g, "\\\"")
      .replace(/'/g, "\\'") + "')";
  };

  // make some config vars available to client
  vars.clientData.minify = vars.minify;
  vars.clientData.contextUrl = bedrock.config.constants.CONTEXT_URL;
  vars.clientData.identityBasePath = bedrock.config.identity.basePath;
  vars.clientData.identityBaseUri =
    vars.baseUri + bedrock.config.identity.basePath;

  if(!req.isAuthenticated()) {
    return callback(null, vars);
  }

  // add session vars
  var user = req.user;
  vars.session.auth = true;
  vars.session.loaded = true;
  vars.session.identity = bedrock.tools.clone(user.identity);
  if(user.identity.label) {
    vars.session.name = user.identity.label;
  } else {
    vars.session.name = user.identity.id;
  }
  vars.clientData.session = vars.session;

  // TODO: use event system to allow other modules to attach view vars
  async.auto({
    // TODO: get identities that session identity is a memberOf? (orgs)
    getIdentities: function(callback) {
      callback();
    },
    custom: ['getIdentities', function(callback) {
      bedrock.events.emit('bedrock-views.vars.get', req, vars, callback);
    }]
  }, function(err) {
    callback(err, vars);
  });
};

bedrock.events.on('bedrock-express.configure.static', function(app) {
  // early handler to detect obsolete browsers
  app.use(function(req, res, next) {
    var ua = req.userAgent = uaParser.parse(req.headers['user-agent'] || '');
    ua.obsolete = false;
    if(ua.family in bedrock.config.website.browserVersions) {
      var version = bedrock.config.website.browserVersions[ua.family];
      if(ua.major < version.major ||
        (ua.major === version.major && ua.minor < version.minor)) {
        ua.obsolete = true;
      }
    }
    next();
  });
});

bedrock.events.on('bedrock-express.configure.routes', configure);

// configure template engine and add routes from config
function configure(app) {
  // setup views
  var viewPaths = bedrock.config.website.views.paths;
  if(!Array.isArray(viewPaths)) {
    viewPaths = [viewPaths];
  }
  var paths = viewPaths.map(function(p) {return path.resolve(p);});

  // add swig as the default template engine
  app.engine('html', function(path, options, callback) {
    var view;
    try {
      var swig = new swigcore.Swig({
        autoescape: false,
        cache: bedrock.config.website.views.cache ? 'memory' : false,
        loader: swigLoaders.multipath({base: paths})
      });
      view = swig.compileFile(path)(options);
    } catch(err) {
      return callback(err);
    }
    callback(null, view);
  });
  app.set('view engine', 'html');
  app.set('views', paths);

  if(bedrock.config.environment === 'down') {
    // system down output for all requests
    app.all('*', function(req, res, next) {
      api.getDefaultViewVars(req, function(err, vars) {
        if(err) {
          return next(err);
        }
        function ldjson() {
          res.send(503, '');
        }
        res.format({
          'application/ld+json': ldjson,
          json: ldjson,
          html: function() {
            res.status(503);
            res.render('error-503.html', vars);
          },
          'default': function() {
            res.send(503);
          }
        });
      });
    });
    return;
  }

  /* Build basic routes from the config.

  The routes config value is an array. Each route value is a string that
  maps to a template filename of "path + '.html'" without the leading '/':
    path
  or an array with path and template filename and optional vars:
    [path, templateFilename, vars]
  or an options object:
  {
    path: path,
    template: templateFileName, (optional)
    vars: {k1:v1, ...} (optional extra vars)
  }
  */
  bedrock.config.website.views.routes.forEach(function(route) {
    var options = {};
    if(typeof route === 'string') {
      options.path = route;
    } else if(Array.isArray(route)) {
      options.path = route[0];
      options.template = route[1];
      options.vars = route[2];
    } else if(typeof route === 'object') {
      options.path = route.path;
      options.template = route.template;
      options.vars = route.vars;
    } else {
      return bedrock.events.emit(
        'bedrock.error', new Error('Invalid website route config.'));
    }
    if(!options.path) {
      return bedrock.events.emit(
        'bedrock.error', new Error('Invalid website route path.'));
    }
    if(!options.template) {
      // generate template filename from path without leading '/'
      options.template = options.path.substr(1) + '.html';
    }
    if(!options.vars) {
      options.vars = {};
    }

    app.get(options.path, function(req, res, next) {
      api.getDefaultViewVars(req, function(err, vars) {
        if(err) {
          return next(err);
        }
        bedrock.tools.extend(true, vars, options.vars);
        res.render(options.template, vars);
      });
    });
  });
}

// occurs after other modules have configured routes
//bedrock.events.on('bedrock-express.start', function(app, callback) {
// TODO: change to line above once deprecated module API is removed
bedrock.events.on('bedrock.start', function(callback) {
  // TODO: remove once deprecated module API is removed
  var app = require('./bedrock-express').app;

  // let other modules do last minute configuration before "not found"
  // handler is attached (or cancel its attachment)
  bedrock.events.emit('bedrock-views.add', function(err, result) {
    if(err || result === false) {
      return callback(err, result);
    }

    // add "not found" handler now that all other routes are configured
    app.all('*', function(req, res, next) {
      api.getDefaultViewVars(req, function(err, vars) {
        if(err) {
          return next(err);
        }
        function ldjson() {
          res.send(404, '');
        }
        res.format({
          'application/ld+json': ldjson,
          json: ldjson,
          html: function() {
            res.status(404);
            res.render('error-404.html', vars);
          },
          'default': function() {
            res.send(404);
          }
        });
      });
    });

    callback();
  });
});

// add error handler
bedrock.events.on('bedrock-express.configure.errorHandlers', function(app) {
  app.use(function(err, req, res, next) {
    if(!err) {
      return next();
    }
    // special check so a custom 403 template can be used
    var isGetPermissionDenied = (req.method === 'GET' &&
      err instanceof BedrockError &&
      err.name === 'bedrock.permission.PermissionDenied');

    // wrap non-bedrock errors
    if(!(err instanceof BedrockError)) {
      err = new BedrockError(
        'An error occurred.',
        MODULE_NS + '.Error', null, err);
    }

    // FIXME: check for 'critical' in exception chain and use
    // that log message instead of error ... and set up email logger
    // to only email critical messages
    var errObject = err.toObject();
    bedrock.logger.error('Error', {error: errObject});

    // setup status code
    if(isGetPermissionDenied) {
      // ensure 403 for permission denied
      res.statusCode = 403;
    } else if(err.details && err.details.httpStatusCode) {
      // set status code if given in top-level error
      res.statusCode = err.details.httpStatusCode;
    } else {
      // FIXME: differentiate between 4xx and 5xx errors
      // default to generic server error
      res.statusCode = 500;
    }

    api.getDefaultViewVars(req, function(_err, vars) {
      if(_err) {
        return next(_err);
      }
      vars.exception = errObject;
      // return public error
      function ldjson() {
        res.json(err.toObject({'public':true}));
      }
      res.format({
        'application/ld+json': ldjson,
        json: ldjson,
        html: function() {
          // switch between custom or generic templates
          if(isGetPermissionDenied) {
            res.render('error-403.html', vars);
          } else {
            res.render('error.html', vars);
          }
        },
        'default': function() {
          res.send();
        }
      });
    });
  });
});
