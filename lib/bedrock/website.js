/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var express = require('express');
var i18n = require('i18n');
var passport = require('passport');
var path = require('path');
var uaParser = require('ua-parser');
var url = require('url');
var swigcore = require('swig');
var swigLoaders = require('./swig.loaders');
var walk = require('walk');
var View = require('express/lib/view');
var bedrock = {
  config: require('../config'),
  events: require('./events'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  security: require('./security'),
  tools: require('./tools'),
  HttpSignatureStrategy: require('./HttpSignatureStrategy'),
  PasswordStrategy: require('./PasswordStrategy')
};
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.website';

// module API
var api = {};
api.name = MODULE_NS;
api.namespace = MODULE_NS;
module.exports = api;

// service sub modules
var services = bedrock.config.website.services;

if(bedrock.config.environment === 'development') {
  /*services.push('system');
  services.push('test');*/
}

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    function(callback) {
      // permit multiple roots for express views
      _allowMultipleViewRoots(express);
      callback();
    },
    function(callback) {
      // configure the web server
      configureServer(app, callback);
    },
    // init service sub modules
    function(callback) {
      var names = Object.keys(bedrock.services);
      async.forEachSeries(names, function(name, callback) {
        bedrock.services[name].init(app, callback);
      }, callback);
    },
    function(callback) {
      // add root services
      addServices(app, callback);
    }
  ], callback);
};

/**
 * Checks authentication of a request. Currently supported methods:
 *
 * - website session based on user and password
 * - HTTP signature: https://github.com/joyent/node-http-signature
 *
 * If both the session and HTTP signature methods are present, their associated
 * identity must match.
 *
 * @param req the request.
 * @param res the response.
 * @param callback callback(err, info) called with error or null and the
 *          found auth info as {identity: ...} or false.
 */
api.checkAuthentication = function(req, res, callback) {
  // FIXME: [auth] may want to allow different signatures
  async.auto({
    // check all methods in parallel
    // FIXME: [auth,opt] multi-sig will do dup ident lookups
    session: function(callback) {
      // do session authentication check
      callback(null, req.isAuthenticated() ? req.user : false);
    },
    httpSignature: function(callback) {
      // check if http signature authentication enabled
      if(!bedrock.config.website.authentication.httpSignature.enabled) {
        return callback(null, false);
      }
      // do http signature authentication check
      passport.authenticate('bedrock.httpSignature',
        function(err, user, info) {
        if(err) {
          return callback(err);
        }
        callback(null, user);
      })(req, res, function(err) {
        // FIXME: handle fake next() args or pull in strategy code?
        callback(err);
      });
    },
    // check signatures match and return final authorization
    auth: ['session', 'httpSignature', function(callback, results) {
      // check session and httpSignature match if both present
      var session = results.session;
      var httpSignature = results.httpSignature;
      // check equality if needed
      if(session && httpSignature &&
        (session.identity.id !== httpSignature.identity.id)) {
        return callback(new BedrockError(
          'Request authentication mismatch.',
          MODULE_NS + '.PermissionDenied', {
            'public': true,
            httpStatusCode: 400
          }));
      }
      // pass on whichever is set
      callback(null, results.session || results.httpSignature || false);
    }]
  }, function(err, results) {
    // 400 if there is an error
    if(err) {
      return callback(new BedrockError(
        'Request authentication error.',
        MODULE_NS + '.PermissionDenied', {
          'public': true,
          httpStatusCode: 400
        }, err));
    }
    callback(null, results.auth);
  });
};

/**
 * Ensure a request has been authenticated. Redirect if not and it looks like
 * a browser GET request, otherwise set 400 error.
 *
 * @param req the request.
 * @param res the response.
 * @param next the next route handler.
 */
api.ensureAuthenticated = function(req, res, next) {
  api.checkAuthentication(req, res, function(err, info) {
    if(err) {
      return next(err);
    }
    // check if good authorization found
    if(info) {
      // avoid any race condition with multiple authorizations
      req.user = info;
      return next();
    }

    // redirect if GET, handles HTML, and not XHR
    // FIXME: would like to just do redir for browsers display to users
    // FIXME: many agents send */* and match this so will get redirs (ie, curl)
    if(req.method === 'GET' && req.accepts('html') && !req.xhr) {
      // include current route as redirect param
      var parsed = url.parse(req.url, true);
      var urlObject = {
        pathname: '/session/login',
        query: {}
      };
      if(parsed.query.ref) {
        urlObject.query.ref = parsed.query.ref;
      }
      else if(parsed.pathname !== '/session/login') {
        urlObject.query.ref = parsed.path;
      }
      return res.redirect(url.format(urlObject));
    }

    // 400 due to no authentication and not a non-XHR HTML GET
    next(new BedrockError(
      'Not authenticated.',
      MODULE_NS + '.PermissionDenied', {
        'public': true,
        httpStatusCode: 400
      }));
  });
};

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
  }
  else {
    vars.session.name = user.identity.id;
  }
  vars.clientData.session = vars.session;

  async.auto({
    // TODO: get identities that session identity is a memberOf? (orgs)
    getIdentities: function(callback) {
      callback();
    }
  }, function(err) {
    callback(err, vars);
  });
};

/**
 * Validates an ID from a URL path and, it passes validation, it will
 * be available via req.params. This method should be passed to an express
 * server's param call, eg:
 *
 * server.param(':foo', idParam)
 *
 * @param req the request.
 * @parma res the response.
 * @param next the next handler.
 * @param id the id.
 */
api.idParam = function(req, res, next, id) {
  var regex = /[a-zA-Z0-9][\-a-zA-Z0-9~_\.]*/;
  if(!regex.test(id)) {
    res.redirect('/');
  }
  else {
    next();
  }
};

/**
 * Configures the web server.
 *
 * @param app the bedrock-auth application.
 * @param callback(err) called once the services have been added to the server.
 */
function configureServer(app, callback) {
  // setup internationalization
  i18n.configure({
    // English is the only supported language at present
    locales: bedrock.config.website.locales,
    // the path to the locale files
    directory: path.resolve(bedrock.config.website.localePath),
    // whether or not to update the locale files during runtime
    updateFiles: bedrock.config.website.writeLocales,
    // register __() and __n() as global
    register: global
  });

  // detect language based on HTTP headers
  app.server.earlyHandlers.push(i18n.init);

  // setup early handler for i18n-based URL rewriting
  var i18nCache = {};
  app.server.earlyHandlers.push(function(req, res, next) {
    if(req.language && req.language in i18nCache) {
      var reqPath = i18nCache[req.language][req.url];
      if(reqPath) {
        req.url = reqPath;
      }
    }
    next();
  });

  // setup views
  var viewPaths = bedrock.config.website.views.paths;
  if(!Array.isArray(viewPaths)) {
    viewPaths = [viewPaths];
  }
  var paths = viewPaths.map(function(p) {return path.resolve(p);});

  // add swig as the default template engine
  app.server.engine('html', function(path, options, callback) {
    try {
      var swig = new swigcore.Swig({
        autoescape: false,
        cache: bedrock.config.website.views.cache,
        loader: swigLoaders.multipath({base: paths})
      });
      var tmpl = swig.compileFile(path);
      return callback(null, tmpl(options));
    }
    catch(err) {
      callback(err);
    }
  });
  app.server.set('view engine', 'html');
  app.server.set('views', paths);

  // add common URL path params
  app.server.param(':identity', api.idParam);

  // define passport user serialization
  passport.serializeUser(function(user, callback) {
    // save identity ID
    callback(null, {identity: user.identity.id});
  });
  passport.deserializeUser(function(data, callback) {
    // look up identity
    var actor = {id: data.identity};
    async.auto({
      getIdentity: function(callback) {
        if(data.identity === null) {
          return callback(null, null);
        }
        bedrock.identity.getIdentity(
          actor, data.identity, function(err, identity) {
            if(err) {
              return callback(err);
            }
            callback(err, identity);
          });
      }
    }, function(err, results) {
      if(err) {
        return callback(err);
      }
      var user = {identity: results.getIdentity};
      callback(null, user);
    });
  });

  // register authentication strategies
  passport.use(new bedrock.PasswordStrategy({
    usernameField: 'sysIdentifier',
    passwordField: 'password'
  }));
  passport.use(new bedrock.HttpSignatureStrategy());

  // build i18n stat cache
  async.forEach(bedrock.config.website.i18nPaths, function(base, callback) {
    var route = '/';
    if(typeof base === 'object') {
      route = base.route;
      base = base.path;
    }
    base = path.resolve(base);
    var walker = walk.walk(base, {followLinks: true});
    walker.on('file', function(root, stat, next) {
      // remove base and language
      var dir = root.substr(base.length);
      var parts = dir.split(path.sep);
      if(parts[0] === '') {
        parts.shift();
      }
      var language = '';
      language = parts[0] || '';
      dir = dir.substr(language.length + path.sep.length);
      if(!(language in i18nCache)) {
        i18nCache[language] = {};
      }
      var reqPath = path.join(route, dir, stat.name);
      i18nCache[language][reqPath] = path.join(route, language, dir, stat.name);
      next();
    });
    walker.on('errors', function(root, stats, next) {
      // FIXME: emit error event?
      next();
    });
    walker.on('end', function() {
      callback();
    });
  });

  // early handler to detect obsolete browsers
  app.server.earlyHandlers.push(function(req, res, next) {
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

  // don't wait
  callback();
}

/**
 * Adds web services to this server.
 *
 * @param app the bedrock-auth application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  if(bedrock.config.environment === 'down') {
    // system down output for all requests
    app.server.all('*', function(req, res, next) {
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
  }

  /*
   * Build basic routes from the config.
   *
   * The routes config value is an array. Each route value is a string that
   * maps to a template filename of "path + '.html'" without the leading '/':
   *   path
   * or an array with path and template filename and optional vars:
   *   [path, templateFilename, vars]
   * or an options object:
   *   {
   *     path: path,
   *     template: templateFileName, (optional)
   *     vars: {k1:v1, ...} (optional extra vars)
   *   }
   */
  bedrock.config.website.views.routes.forEach(function(route) {
    var options = {};
    if(typeof route === 'string') {
      options.path = route;
    }
    else if(Array.isArray(route)) {
      options.path = route[0];
      options.template = route[1];
      options.vars = route[2];
    }
    else if(typeof route === 'object') {
      options.path = route.path;
      options.template = route.template;
      options.vars = route.vars;
    }
    else {
      return callback(new Error('Invalid website route config.'));
    }
    if(!options.path) {
      return callback(new Error('Invalid website route path.'));
    }
    if(!options.template) {
      // generate template filename from path without leading '/'
      options.template = options.path.substr(1) + '.html';
    }
    if(!options.vars) {
      options.vars = {};
    }

    app.server.get(options.path, function(req, res, next) {
      api.getDefaultViewVars(req, function(err, vars) {
        if(err) {
          return next(err);
        }
        bedrock.tools.extend(true, vars, options.vars);
        res.render(options.template, vars);
      });
    });
  });

  // not found handler
  app.server.all('*', function(req, res, next) {
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

  // send errors
  app.server.errorHandlers.push(function(err, req, res, next) {
    if(err) {
      // handle forbidden
      if(req.method === 'GET' &&
        err instanceof BedrockError && err.name ===
        'bedrock.permission.PermissionDenied') {
        return api.getDefaultViewVars(req, function(err, vars) {
          if(err) {
            return next(err);
          }
          res.status(403);
          res.render('error-403.html', vars);
        });
      }

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

      // set status code if given in top-level error
      if(err.details && err.details.httpStatusCode) {
        res.statusCode = err.details.httpStatusCode;
      }
      else {
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
            res.render('error.html', vars);
          },
          'default': function() {
            res.send();
          }
        });
      });
      return;
    }
    next();
  });

  callback();
}

// allows multiple view root paths to be used
function _allowMultipleViewRoots(express) {
  var old = View.prototype.lookup;
  View.prototype.lookup = function(path) {
    var self = this;
    var root = self.root;
    // if root is an array, try each root in reverse order until path exists
    if(Array.isArray(root)) {
      var foundPath;
      for(var i = root.length - 1; i >= 0; --i) {
        self.root = root[i];
        foundPath = old.call(self, path);
        if(foundPath) {
          break;
       }
      }
      self.root = root;
      return foundPath;
    }
    // fallback to standard behavior, when root is a single directory
    return old.call(self, path);
  };
}

// load service sub modules
bedrock.services = {};
services.forEach(function(name) {
  if(name[0] !== '/') {
    name = __dirname + '/services.' + name;
  }
  var p = path.resolve(name);
  bedrock.logger.info('loading website service module: ' + p);
  bedrock.services[p] = require(p);
});
