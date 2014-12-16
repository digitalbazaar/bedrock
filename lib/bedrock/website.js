/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var i18n = require('i18n');
var passport = require('passport');
var path = require('path');
var uaParser = require('ua-parser');
var walk = require('walk');
var bedrock = {
  config: require('../config'),
  events: require('./events'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  security: require('./security'),
  tools: require('./tools'),
  validation: require('./validation'),
  HttpSignatureStrategy: require('./HttpSignatureStrategy'),
  PasswordStrategy: require('./PasswordStrategy')
};
var BedrockError = bedrock.tools.BedrockError;
var validate = bedrock.validation.validate;

// constants
var MODULE_NS = 'bedrock.website';

// module API
var api = {};
api.name = MODULE_NS;
api.namespace = MODULE_NS;
module.exports = api;

// TODO: here for backwards-compatibility support only, deprecate and
// remove website.js entirely
var bedrockViews = require('./bedrock-views');
api.getDefaultViewVars = bedrockViews.getDefaultViewVars;
api.addViewVarsHandler = bedrockViews.addViewVarsHandler;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  configureServer(app, callback);
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
 * Process a request has been optionally authenticated. Code using this call
 * can check if the request is authenticated by testing if req.user and
 * req.user.identity are set.
 *
 * @param req the request.
 * @param res the response.
 * @param next the next route handler.
 */
api.optionallyAuthenticated = function(req, res, next) {
  api.checkAuthentication(req, res, function(err, info) {
    if(err) {
      return next(err);
    }
    // if authorization found, set req.user
    if(info) {
      // avoid any race condition with multiple authorizations
      req.user = info;
    }
    next();
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
  api.optionallyAuthenticated(req, res, function(err) {
    if(err) {
      return next(err);
    }
    // authenticated
    if(req.user) {
      return next();
    }
    // not authenticated
    next(new BedrockError(
      'Not authenticated.',
      MODULE_NS + '.PermissionDenied', {
        'public': true,
        httpStatusCode: 400
      }));
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
  } else {
    next();
  }
};

/**
 * Convert errors as needed based on an error map.
 *
 * FIXME: remove this via better global conventions
 */
function _errorMapper(err, map) {
  if(!map || !(err.name in map)) {
    return err;
  }
  switch(map[err.name]) {
    case 'bedrock.website.NotFound':
      return new BedrockError('Resource not found',
        'bedrock.website.NotFound', {
          'public': true,
          httpStatusCode: 404
        });
    default:
      // failsafe
      return err;
  }
}

/**
 * Wrapper to get resources and handle error mapping.
 */
function _getResource(res, req, options, callback) {
  return options.get(res, req, function(err, data) {
    if(err) {
      return callback(_errorMapper(err, options.errorMap));
    }
    callback(null, data);
  });
}

/**
 * Make middleware for a type negotiated REST resource.
 *
 * FIXME: Add docs.
 *
 * @param options the handler options.
 *   validate: content to pass to bedrock.validation.validate
 *   get(req, res, callback(err, data)): get resource data
 *   template: template file name for HTML mode (default: 'main.html')
 *   templateNeedsResource: boolean flag to get resource for template
 *   updateVars(resource, vars, callback(err)): update vars with resource
 */
api.makeResourceHandler = function(options) {
  options = options || {};
  var middleware = [];
  // optional validation
  if(options.validate) {
    middleware.push(validate(options.validate));
  }
  // main handler
  middleware.push(function(req, res, next) {
    function _json() {
      if(!options.get) {
        res.send(204);
        return;
      }
      _getResource(req, res, options, function(err, data) {
        if(err) {
          return next(err);
        }
        res.json(data);
      });
    }
    function _html() {
      async.auto({
        vars: function(callback) {
          api.getDefaultViewVars(req, callback);
        },
        identity: ['vars', function(callback, results) {
          if(!req.user || !req.user.identity) {
            return callback();
          }
          // get identity based on session
          bedrock.identity.getIdentity(
            req.user.identity, req.user.identity.id, function(err, identity) {
              if(err) {
                return callback(err);
              }
              results.vars.identity = identity;
              results.vars.clientData.identity = identity;
              callback();
            });
        }],
        resource: ['identity', function(callback) {
          if(options.templateNeedsResource) {
            return _getResource(req, res, options, callback);
          }
          callback();
        }],
        updateVars: ['resource', function(callback, results) {
          if(options.templateNeedsResource && options.updateVars) {
            return options.updateVars(
              results.resource, results.vars, callback);
          }
          callback();
        }]
      }, function(err, results) {
        if(err) {
          return next(err);
        }
        // FIXME use option for template name
        res.render(options.template || 'main.html', results.vars);
      });
    }
    res.format({
      'application/ld+json': _json,
      json: _json,
      html: _html,
      'default': function() {
        next(new BedrockError(
          'Requested content types not acceptable.',
          MODULE_NS + '.NotAcceptable', {
            'public': true,
            httpStatusCode: 406,
            details: {
              accepted: req.accepted.map(function(obj) { return obj.value; }),
              acceptable: [
                'application/json',
                'application/ld+json',
                'text/html'
              ]
            }
          }));
      }
    });
  });
  return async.applyEachSeries(middleware);
};

/**
 * Configures the web server.
 *
 * @param app the bedrock-auth application.
 * @param callback(err) called once the operation completes.
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
