/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  docs: require('./docs'),
  logger: require('./loggers').get('app'),
  validation: require('./validation'),
  website: require('./website')
};
var validate = bedrock.validation.validate;

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
 * @param app the application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.get('/docs',
    validate({query: 'services.docs.getDocsQuery'}),
    function(req, res, next) {
    async.waterfall([
      function(callback) {
        bedrock.website.getDefaultViewVars(req, function(err, vars) {
          if(err) {
            return callback(err);
          }
          vars.host = bedrock.config.server.host;
          var topic = req.query.topic;
          if(topic) {
            // skip to next middleware (will 404) if document does not exist
            vars.docs = bedrock.docs.getDetails(topic);
            if(vars.docs === undefined) {
              return next();
            }
            res.render('docs/' + topic + '.html', vars);
          }
          else {
            vars.categories = bedrock.docs.getCategories();
            vars.docIndex = bedrock.docs.getDocIndex();
            res.render('docs/index.html', vars);
          }
        });
      }
    ], function(err) {
      if(err) {
        return next(err);
      }
    });
  });

  callback();
}
