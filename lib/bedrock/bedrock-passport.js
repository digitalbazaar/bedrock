/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
// TODO: just require('bedrock')
var bedrock = {
  config: require('../config'),
  events: require('./events'),
  identity: require('./identity'),
  tools: require('./tools')
};
var passport = require('passport');
var BedrockError = bedrock.tools.BedrockError;
var HttpSignatureStrategy = require('./HttpSignatureStrategy');
var PasswordStrategy = require('./PasswordStrategy');

// constants
var MODULE_NS = 'bedrock.website';

// module API
var api = {};
module.exports = api;

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
 * @param callback(err, info) called with error or null and the
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
      passport.authenticate('bedrock.httpSignature', function(err, user) {
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

// TODO: remove environment check, module should simply be omitted
// by a "down" config
if(bedrock.config.environment !== 'down') {
  // configure passport before serving static files
  bedrock.events.on('bedrock-express.configure.static', configure);
}

function configure(app) {
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
  passport.use(new PasswordStrategy({
    usernameField: 'sysIdentifier',
    passwordField: 'password'
  }));
  passport.use(new HttpSignatureStrategy());

  // init and attach passport
  app.use(passport.initialize());
  app.use(passport.session());
}
