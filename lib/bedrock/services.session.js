/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var passport = require('passport');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  events: require('./events'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  permission: require('./permission'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var url = require('url');
var BedrockError = bedrock.tools.BedrockError;
var getDefaultViewVars = bedrock.website.getDefaultViewVars;
var validate = bedrock.validation.validate;

// constants
var MODULE_NS = bedrock.website.namespace;

// sub module API
var api = {};
module.exports = api;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  addServices(app, callback);
};

/**
 * Adds web services to the server.
 *
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.get('/join',
    function(req, res, next) {
      getDefaultViewVars(req, function(err, vars) {
        if(err) {
          return next(err);
        }
        vars.redirect = false;
        res.render('create.html', vars);
      });
  });

  app.server.post('/join',
    validate('services.session.postJoin'),
    function(req, res, next) {
      async.waterfall([
        function(callback) {
          api._createIdentity({}, req, callback);
        },
        function(results, callback) {
          req.body.sysIdentifier = results.identity.id;
          req.body.password = req.body.sysPassword;
          _login(req, res, next, function(err) {
            if(err) {
              return next(new BedrockError(
                'Could not create a session for the newly created identity.',
                MODULE_NS + '.AutoLoginFailed', {}, err));
            }
            res.json({ref: results.identity.id + '/dashboard'});
          });
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
      });
    });

  app.server.get('/session/login',
    validate({query: 'services.session.getLoginQuery'}),
    function(req, res, next) {
    // redirect authenticated requests to the referral URL
    if(req.isAuthenticated()) {
      var ref = req.query.ref || '/';
      return res.redirect(ref);
    }

    // not authenticated, send login page
    getDefaultViewVars(req, function(err, vars) {
      if(err) {
        return next(err);
      }
      // include referring URL unless it is to the same page
      if(req.query.ref && req.query.ref !== '/session/login') {
        vars.ref = req.query.ref;
        vars.clientData.ref = req.query.ref;
      }
      // include session expired var if appropriate
      if(req.query.expired === 'true') {
        vars.clientData.sessionExpired = true;
      }
      res.render('login.html', vars);
    });
  });

  app.server.post('/session/login',
    validate('services.session.postLogin'),
    function(req, res, next) {
      _login(req, res, next, function(err, user, choice) {
        if(err) {
          return next(err);
        }
        var out = {};
        // multiple identities matched credentials
        if(!user) {
          out.email = choice.email;
          out.identities = choice.identities;
        }
        else if(req.body.ref) {
          out.ref = req.body.ref;
        }
        else if(user.identity) {
          out.ref = user.identity.id + '/dashboard';
        }
        else {
          out.ref = '/';
        }
        // FIXME: add method to do:
        // if(req.accepts('application/ld+json')) {
        //   res.type('application/ld+json');
        // }
        // FIXME: and then use res.send() instead of res.json()?
        res.json(out);
      });
  });

  app.server.get('/session/logout',
    function(req, res, next) {
      if(req.session) {
        return req.session.destroy(function(err) {
          if(err) {
            next(err);
          }
          res.redirect('/');
        });
      }
      res.redirect('/');
  });

  app.server.post('/session/password/reset',
    validate('services.session.postPasswordReset'),
    function(req, res, next) {
      // either an identity slug or email address
      var identifier = req.body.sysIdentifier;
      async.waterfall([
        function(callback) {
          bedrock.identity.resolveIdentityIdentifier(identifier, callback);
        },
        function(identityIds, callback) {
          // try to set password for all identities until one is successful
          var success = 0;
          async.until(function() {return success !== 0;}, function(callback) {
            if(identityIds.length === 0) {
              success = -1;
              return callback();
            }
            var next = identityIds.shift();
            var identity = bedrock.tools.clone(req.body);
            identity.id = next;
            bedrock.identity.setIdentityPassword(
              {id: next}, identity, function(err) {
                if(!err) {
                  success = 1;
                }
                callback();
              });
          }, function(err) {
            callback(null, success === 1);
          });
        },
        function(success, callback) {
          if(!success) {
            return callback(new BedrockError(
              'The password reset failed for the given identity.',
              MODULE_NS + '.PasswordResetFailed', {
                sysIdentifier: req.body.sysIdentifier,
                httpStatusCode: 403,
                'public': true}));
          }
          callback();
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  app.server.get('/session/passcode',
    validate({query: 'services.session.getPasscodeQuery'}),
    function(req, res, next) {
    getDefaultViewVars(req, function(err, vars) {
      if(err) {
        return next(err);
      }
      vars.redirect = false;
      if('passcode' in req.query) {
        vars.clientData.sysPasscode = req.query.passcode;
      }
      res.render('passcode.html', vars);
    });
  });

  app.server.post('/session/passcode',
    validate('services.session.postPasscode'),
    function(req, res, next) {
      var identifier = req.body.sysIdentifier;
      async.waterfall([
        function(callback) {
          bedrock.identity.resolveIdentityIdentifier(identifier, callback);
        },
        function(identityIds, callback) {
          // identity not found
          if(identityIds.length === 0) {
            return callback(new BedrockError(
              'The given email address is not registered.',
              MODULE_NS + '.IdentityNotFound', {
                sysIdentifier: req.body.sysIdentifier,
                httpStatusCode: 404,
                'public': true
              }));
          }
          // look up identities
          var query = {id: {$in: []}};
          identityIds.forEach(function(identityId) {
            query.id.$in.push(bedrock.db.hash(identityId));
          });
          bedrock.identity.getIdentities(
            null, query, {identity: true}, function(err, records) {
              if(err) {
                return callback(err);
              }
              // send passcode for every identity match
              var identities = [];
              records.forEach(function(record) {
                identities.push(record.identity);
              });
              // determine passcode usage based on query param
              var usage = 'reset';
              if(req.query.usage === 'verify') {
                usage = 'verify';
              }
              else if(req.query.usage === 'reset') {
                usage = 'reset';
              }
              bedrock.identity.sendIdentityPasscodes(
                identities, usage, callback);
            });
        }
      ], function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });

  app.server.errorHandlers.push(function(err, req, res, next) {
    if(err.name !== 'bedrock.website.PermissionDenied') {
      return next(err);
    }

    // redirect if user agent is browser, request accepts HTML and is not XHR
    // FIXME: would like to just do redir for browsers display to users
    // FIXME: many agents send */* and match this so will get redirs (ie, curl)
    var isBrowser = (req.userAgent.family in
      bedrock.config.website.browserVersions);
    if(isBrowser && req.accepts('html') && !req.xhr) {
      if(req.method === 'GET' ) {
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
    }

    next(err);
  });

  callback(null);
}

/**
 * Identity creation service. Used by normal and testing services.
 */
api._createIdentity = function(options, req, callback) {
  var identityId = bedrock.identity.createIdentityId(req.body.sysSlug);
  async.auto({
    createIdentity: function(callback) {
      // create identity
      var identityId = bedrock.identity.createIdentityId(req.body.sysSlug);
      var identity = {
        '@context': bedrock.config.constants.CONTEXT_URL,
        id: identityId,
        sysSlug: req.body.sysSlug,
        label: req.body.label,
        email: req.body.email,
        sysPassword: req.body.sysPassword
      };
      bedrock.identity.createIdentity(
        null, identity, function(err, record) {
        if(err) {
          return callback(err);
        }
        callback(null, record.identity);
      });
    }
  }, function(err, results) {
    if(err) {
      if(bedrock.db.isDuplicateError(err)) {
        err = new BedrockError(
          'Could not create identity, it is a duplicate.',
          MODULE_NS + '.DuplicateIdentity', {
            identity: identityId,
            'public': true,
            httpStatusCode: 400
          });
      }
      return callback(err);
    }
    // result details
    var details = {identity: results.createIdentity};
    // schedule identity created event
    bedrock.events.emit({
      type: 'bedrock.Identity.created',
      details: details
    });
    callback(null, details);
  });
};

// perform login
function _login(req, res, next, callback) {
  passport.authenticate('bedrock.password', function(err, user, info) {
    if(!user) {
      // multiple identity matches
      if(info.matches) {
        // get mapping of identity ID to identity
        var choice = {
          email: info.email,
          identities: {}
        };
        return async.forEach(info.matches, function(id, callback) {
          bedrock.identity.getIdentity(
            null, id, function(err, identity) {
              if(err) {
                return callback(err);
              }
              choice.identities[id] = identity;
              callback();
            });
        }, function(err) {
          if(err) {
            return next(err);
          }
          callback(null, false, choice);
        });
      }
      // some other error
      err = new BedrockError(
        'The email address and password combination ' +
        'you entered is incorrect.', MODULE_NS + '.InvalidLogin',
        {'public': true, httpStatusCode: 400});
    }
    if(err) {
      return next(err);
    }
    req.logIn(user, function(err) {
      callback(err, user);
    });
  })(req, res, next);
}
