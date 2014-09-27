/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var bedrock = {
  config: require('../config'),
  docs: require('./docs'),
  events: require('./events'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation'),
  website: require('./website')
};
var raml2html = require('raml2html');
var validate = bedrock.validation.validate;
var BedrockError = bedrock.tools.BedrockError;

// sub module API
var api = {};
module.exports = api;

// constants
var MODULE_NS = bedrock.website.namespace;

// API documentation
var ramlSource = '';

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  addServices(app, callback);

  bedrock.events.on('bedrock.started', function(event) {
    var methods = ['get', 'post', 'put', 'patch', 'delete'];
    var serviceMap = {};

    // perform discovery on all of the endpoints
    _.each(methods, function(method) {
      _.each(app.server.routes[method], function(service) {
        var rawPath = service.path;
        var path = rawPath.replace(/(\:[a-zA-Z0-9]+)/g, function(v) {
          return '{' + v.replace(':', '') + '}';
        });

        if(!serviceMap.hasOwnProperty(path)) {
          serviceMap[path] = [];
        }

        serviceMap[path].push(service);
      });
    });

    // cleanup default path handlers
    delete serviceMap['*'];
    delete serviceMap['/'];

    /*
    console.log("******** SETUP DOCS", serviceMap);

    _.each(serviceMap['/i/{identity}/keys/{publicKey}'], function(method) {
      _.each(method.callbacks, function(cb) {
          console.log("FUNCTION", method.method, cb.toString());
      });
    }); */

    //console.log("SMK", _.keys(serviceMap).sort());

    // generate the RAML source file
    ramlSource = '#%RAML 0.8\n' +
      '---\n' +
      'title: ' + bedrock.config.brand.name + ' REST\n' +
      'baseUri: ' + bedrock.config.server.baseUri + '/\n' +
      'version: 1.0\n';

    var sortedKeys = _.keys(serviceMap).sort();
    _.each(sortedKeys, function(key, index) {
      // find a parent path, if any
      var currentPath = null;
      var parentPath = '';
      for(var i = index - 1; i > 1; i--) {
        if(key.indexOf(sortedKeys[i]) === 0) {
          parentPath = sortedKeys[i];
          currentPath = key.replace(sortedKeys[i], '');

          // if the current path doesn't start with a /, it was a false match
          if(currentPath[0] !== '/') {
            parentPath = '';
            currentPath = null;
          } else {
            i = 0;
          }
        }
      }
      if(!currentPath) {
        currentPath = key;
      }

      // calculate the indent depth
      var indent = '';
      var depth = parentPath.split('/').length - 1;
      for(var j = 0; j < depth; j++) {
        indent += '  ';
      }

      ramlSource += indent + currentPath + ':\n';

      // specify the methods
      _.each(serviceMap[key], function(handler) {
        ramlSource += indent + '  ' + handler.method + ':\n';
      });
    });

    //console.log(ramlSource);
  });
};

/**
 * Adds web services to the server.
 *
 * @param app the application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  app.server.get('/docs',
    function(req, res, next) {
    async.waterfall([
      function(callback) {
        bedrock.website.getDefaultViewVars(req, function(err, vars) {
          if(err) {
            return callback(err);
          }

          var ramlConfig = raml2html.getDefaultConfig(true);
          var source = '#%RAML 0.8\n---\ntitle: e-BookMobile\nbaseUri: http://api.e-bookmobile.com/{version}\nversion: v1\n';
          raml2html.render(ramlSource, ramlConfig, function(result) {
            res.send(result);
          }, function(err) {
            return next(new BedrockError(
              'There was an error generating the documentation.',
              MODULE_NS + '.RestApiDocumentationGenerationFailed', {
                httpStatusCode: 400,
                'public': true
              }, err));
          });
      });
    }], function(err) {
      if(err) {
        return next(err);
      }
    });
  });

  callback();
}
