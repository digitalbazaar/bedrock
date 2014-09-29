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
var fs = require('fs');
var path = require('path');
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
var ramlHtml = '';

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

    // Remove root and default handlers
    delete serviceMap['*'];
    delete serviceMap['/'];

    // generate the base RAML source file by stiching together sections
    var sections = bedrock.config.website.docs.sections;
    async.eachSeries(sections, function(section, callback) {
      var docPaths = bedrock.config.website.docs.paths;
      var sectionFiles = [];
      _.each(docPaths, function(docPath) {
        sectionFiles.push(path.join(docPath, section));
      });
      // search the website documentation paths for the section
      async.detectSeries(sectionFiles, fs.exists, function(result) {
        if(!result) {
          return callback(new BedrockError(
            'Failed to locate REST API section file.',
            MODULE_NS + '.DocumentationFileDoesNotExist',
            {section: section}));
        }

        fs.readFile(result, {encoding: 'utf8'}, function(err, data) {
          var sectionText = data;
          if(err) {
            return callback(new BedrockError(
              'Failed to load REST API section file.',
            MODULE_NS + '.DocumentationFileLoadFailed',
            {error: err}));
          }
          // replace the documentation template variables
          var docVars = bedrock.config.website.docs.vars;
          _.each(_.keys(bedrock.config.website.docs.vars), function(docVar) {
            var replacement = docVars[docVar];
            var re = new RegExp('\\{\\{' + docVar + '\\}\\}', 'g');
            sectionText = sectionText.replace(re, replacement);
          });
          ramlSource += sectionText;
          callback();
        });
      });
    }, function(err) {
      if(err) {
        return bedrock.logger.error(
          'failed to load section of REST API documentation', {error: err});
      }
      _buildDocs(serviceMap, callback);
    });
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
         res.send(ramlHtml);
      });
    }], function(err) {
      if(err) {
        return next(err);
      }
    });
  });

  callback();
}

/**
 * Builds the REST API documentation given a map of all URL endpoints served
 * by the system.
 *
 * @param serviceMap a URL map of all service endpoints for the system.
 * @param callback(err) called once the documentation has been built.
 */
function _buildDocs(serviceMap, callback) {
    // build the REST API documentation
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

    // Add documentation for each HTTP method
    ramlSource += indent + currentPath + ':\n';
    _.each(serviceMap[key], function(handler) {
      var ramlSnippet =
        bedrock.docs.getRaml(handler.method, key, indent + '  ');
      if(ramlSnippet) {
        ramlSource += ramlSnippet;
      } else {
        bedrock.logger.warning('no REST API documentation exists for ' + key);
        ramlSource += indent + '  ' + handler.method + ':\n' +
          indent + '    description: undocumented\n';
      }
    });
  });

  // build and cache the HTML documentation
  var ramlConfig = raml2html.getDefaultConfig(true);
  raml2html.render(ramlSource, ramlConfig, function(result) {
    ramlHtml = result;
  }, function(err) {
    bedrock.logger.error(
      'failed to build REST API documentation', {error: err});
  });

  console.log(ramlSource);
}