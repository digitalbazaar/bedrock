/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation')
};
var util = require('util');

var api = {};
module.exports = api;

// the annotation module
var annotate = {};

// the REST API annotations
var docs = {
  get: {},
  post: {},
  put: {},
  patch: {},
  'delete': {}
};

/**
 * Retrieve a RAML annotation for a particular method and path. The indentation
 * level must be provided.
 *
 * @param method the HTTP method.
 * @param path the full REST API path in RAML format (using '{' and '}' for
 *          path variables.)
 * @param indent a string of spaces based on the indent level.
 *
 * @returns a RAML string that can be injected into a master RAML file.
 */
api.getRaml = function(method, path, indent) {
  // get the RAML documentation for a particular method and path
  var doc = docs[method][path];
  var raml = null;

  // add display name for category

  if(doc) {
    raml = '';

    if(doc.displayName) {
      raml += indent + 'displayName: ' + doc.displayName + '\n';
    }

    raml += indent + method + ':\n';
    indent += '  ';

    // add description
    if(doc.description) {
      raml += indent + 'description: ' + doc.description + '\n';
    }
    // add security protections
    if(doc.securedBy) {
      raml += indent + 'securedBy: [' + doc.securedBy + ']\n';
    }
    // add documentation on response codes
    if(doc.responses) {
      raml += indent + 'responses:\n';
      _.each(_.keys(doc.responses).sort(), function(code) {
        raml += indent + '  ' + code + ':\n';
        if(_.isString(doc.responses[code])) {
          // add description for the response code
          raml += indent + '    description: ' + doc.responses[code] + '\n';
        } else if(_.isObject(doc.responses[code])) {
          // add detailed description for response code
          _.each(_.keys(doc.responses[code]), function(resType) {
            var example = doc.responses[code][resType].example;
            raml += indent + '    body: \n';
            raml += indent + '      ' + resType + ':\n';
            if(example) {
              var formattedExample = indent + '          ' +
                JSON.stringify(example, null, 2)
                  .replace(/\n/g, indent + '\n                  ');
              raml += indent + '        example: |\n' + formattedExample + '\n';
            }
          });
        }
      });
    }
  }

  return raml;
};

/**
 * Documents a particular method and path of the system.
 *
 * @param method the HTTP method name.
 * @param path the HTTP path from the root of the server. The path may include
 *   named variables like /i/:identity.
 * @param doc the documentation object for the given path
 *   views/docs/ directory.
 */
api.document = function(method, path, doc) {
  var ramlPath =  path.replace(/(\:[a-zA-Z0-9]+)/g, function(v) {
    return '{' + v.replace(':', '') + '}';
  });
  docs[method][ramlPath] = doc;
};

// short-hand aliases for the documentation methods
annotate.get = function(path, docs) {
  docs.method = 'get';
  api.document('get', path, docs);
};

annotate.post = function(path, docs) {
  docs.method = 'post';
  api.document('post', path, docs);
};

annotate.put = function(path, docs) {
  docs.method = 'put';
  api.document('put', path, docs);
};

annotate.patch = function(path, docs) {
  docs.method = 'patch';
  api.document('patch', path, docs);
};

annotate.delete = function(path, docs) {
  docs.method = 'delete';
  api.document('delete', path, docs);
};

api.annotate = annotate;
