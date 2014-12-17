/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  events: require('./events'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation')
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
require('./bedrock-i18n');
var bedrockPassport = require('./bedrock-passport');
api.checkAuthentication = bedrockPassport.checkAuthentication;
api.optionallyAuthenticated = bedrockPassport.optionallyAuthenticated;
api.ensureAuthenticated = bedrockPassport.ensureAuthenticated;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // add common URL path params
  app.server.param(':identity', api.idParam);

  callback();
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
