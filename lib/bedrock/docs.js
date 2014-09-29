/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var fs = require('fs');
var path = require('path');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation')
};
var BedrockError = bedrock.tools.BedrockError;

var api = {};
module.exports = api;

// the annotation module
var annotate = {};

// constants
var MODULE_NS = 'bedrock.docs';

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
 * @param callback(err, ramlSnippet) an error, or a RAML string that can be
 *          injected into a master RAML file.
 */
api.getRaml = function(method, path, indent, callback) {
  // get the RAML documentation for a particular method and path
  var doc = docs[method][path];
  var raml = null;

  // end early if there is no documentation for the method and path
  if(!doc) {
    return callback(new BedrockError(
        'No documentation exists for given REST API method and path.',
        MODULE_NS + '.NoDocumentation', {
          method: method,
          path: path
    }));
  }

  raml = '';
  // add display name for category
  if(doc.displayName) {
    raml += indent + 'displayName: ' + doc.displayName + '\n';
  }

  // add method type
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

  // end early if there is no response documentation for the method/path
  if(!doc.responses) {
    return callback(null, raml);
  }

  // add documentation on response codes
  raml += indent + 'responses:\n';
  var sortedCodes = _.keys(doc.responses).sort();
  async.eachSeries(sortedCodes, function(code, callback) {
    raml += indent + '  ' + code + ':\n';

    // handle simple docs for responses
    if(_.isString(doc.responses[code])) {
      // add description for the response code
      raml += indent + '    description: ' + doc.responses[code] + '\n';
      return callback();
    }

    if(!_.isObject(doc.responses[code])) {
      return callback();
    }

    // handle complex docs with examples
    // add detailed description for response code
    var sortedTypes = _.keys(doc.responses[code]);
    async.eachSeries(sortedTypes, function(resType, callback) {
      var example = doc.responses[code][resType].example;
      raml += indent + '    body: \n';
      raml += indent + '      ' + resType + ':\n';

      // return if there isn't an example
      if(!example) {
        return callback();
      }
      // return if the example doesn't end in .jsonld
      if(example.indexOf('.jsonld', example.length - 7) === -1) {
        return callback();
      }

      // process JSON-LD example files
      var docPaths = bedrock.config.website.docs.paths;
      var docVars = bedrock.config.website.docs.vars;
      api.loadFile(example, docPaths, docVars, function(err, data) {
        if(err) {
          return callback(err);
        }
        var formattedExample = indent + '          ' +
          data.replace(/\n/g, '\n' + indent + '          ');
        raml += indent + '        example: |\n' +
          formattedExample + '\n';
        callback();
      });
    }, callback);
  }, function(err) {
    callback(err, raml);
  });
};

/**
 * Loads a documentation file from disk, making the appropriate template
 * replacements.
 *
 */
api.loadFile = function(section, paths, vars, callback) {
  var docFiles = [];
  var docText = '';

  // build the list of possible files
  _.each(paths, function(docPath) {
    docFiles.push(path.join(docPath, section));
  });

  // search the website documentation paths for the document
  async.detectSeries(docFiles, fs.exists, function(result) {
    if(!result) {
      return callback(new BedrockError(
        'Failed to locate REST API documentation file.',
        MODULE_NS + '.DocumentationFileDoesNotExist',
        {section: section}));
    }

    // read the website docs
    fs.readFile(result, {encoding: 'utf8'}, function(err, data) {
      var docText = data;
      if(err) {
        return callback(new BedrockError(
          'Failed to load REST API section file.',
        MODULE_NS + '.DocumentationFileLoadFailed',
        {error: err}));
      }
      // replace the documentation template variables
      _.each(_.keys(vars), function(docVar) {
        var replacement = vars[docVar];
        var re = new RegExp('\\{\\{' + docVar + '\\}\\}', 'g');
        docText = docText.replace(re, replacement);
      });

      callback(null, docText);
    });
  });
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
