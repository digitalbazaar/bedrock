/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  identity: require('./identity'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var BedrockError = bedrock.tools.BedrockError;
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
  // do initialization work
  async.waterfall([
    function(callback) {
      addServices(app, callback);
    }
  ], callback);
};

/**
 * Adds web services to the server.
 *
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.post('/identifier',
    validate('services.identifier.postIdentifier'),
    function(req, res, next) {
      // get ID and lookup function based on posted type
      var id = null;
      var lookup = null;
      var query = null;
      var options = {limit: 1};
      switch(req.body.type) {
      case 'Identity':
        id = bedrock.identity.createIdentityId(req.body.sysSlug);
        lookup = bedrock.identity.getIdentities;
        break;
      case 'email':
        lookup = bedrock.identity.getIdentities;
        query = {'identity.email': req.body.email};
        break;
      }

      async.waterfall([
        function(callback) {
          if(!lookup) {
            // return that ID is not available
            return callback(null, false);
          }

          // check for ID existence
          query = query || {id: bedrock.db.hash(id)};
          lookup(null, query, {_id: true}, options, function(err, exists) {
            if(err) {
              return next(err);
            }
            callback(null, exists.length === 0);
          });
        },
        function(available, callback) {
          if(available) {
            return res.send(204);
          }

          // ID is not available
          callback(new BedrockError(
            'The chosen identifier is already in use.',
            MODULE_NS + '.DuplicateId', {
              httpStatusCode: 409,
              'public': true
            }));
        }
      ], function(err) {
        next(err);
      });
  });

  callback(null);
}
