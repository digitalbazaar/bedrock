/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  docs: require('./docs'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var BedrockError = bedrock.tools.BedrockError;
var validate = bedrock.validation.validate;

// constants
// TODO: change to 'bedrock.services'
var MODULE_NS = bedrock.website.namespace;

// module API
var api = {};
api.name = MODULE_NS + '.identifier';
api.namespace = MODULE_NS;
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
 * Common identifier lookup code.
 *
 * @param options object with checking options:
 *          lookup: function to use to lookup identifier
 *          id: id to check (optional)
 *          query: query options (optional, default: {id: hash(id)})
 * @param callback callback(err) called when done with possible error.
 */
function _check(options, callback) {
  // check for ID existence
  var query = options.query || {id: bedrock.db.hash(options.id)};
  options.lookup(null, query, {_id: true}, {limit: 1}, function(err, exists) {
    if(err) {
      return callback(err);
    }
    if(exists.length !== 0) {
      // ID is not available
      return callback(new BedrockError(
        'The chosen identifier is already in use.',
        MODULE_NS + '.DuplicateId', {
          httpStatusCode: 409,
          'public': true
        }));
    }
    callback();
  });
}

/**
 * Adds web services to the server.
 *
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.post('/identifier/email',
    validate('services.identifier.postEmailIdentifier'),
    function(req, res, next) {
      _check({
        lookup: bedrock.identity.getIdentities,
        query: {'identity.email': req.body.email}
      }, function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });
  bedrock.docs.annotate.post('/identifier/email', {
    description: 'Check to see if the given email address has already ' +
      'been registered.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.identifier.postEmailIdentifier',
    responses: {
      204: 'The email address is not in use.',
      409: 'The email address is in use.'
    }
  });

  app.server.post('/identifier/identity',
    validate('services.identifier.postIdentityIdentifier'),
    function(req, res, next) {
      _check({
        lookup: bedrock.identity.getIdentities,
        id: bedrock.identity.createIdentityId(req.body.sysSlug)
      }, function(err) {
        if(err) {
          return next(err);
        }
        res.send(204);
      });
  });
  bedrock.docs.annotate.post('/identifier/identity', {
    description: 'Check to see if the given identity nickname is in use.',
    securedBy: ['cookie', 'hs1'],
    schema: 'services.identifier.postIdentityIdentifier',
    responses: {
      204: 'The nickname is not in use.',
      409: 'The nickname address is in use.'
    }
  });

  callback(null);
}
