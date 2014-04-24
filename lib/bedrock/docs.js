/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var fs = require('fs');
var path = require('path');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  validation: require('./validation')
};
var util = require('util');

// infinity character
var INFINITY = '\u221E';

var api = {};
module.exports = api;

// the documentation directory index (used for the top-level docs page)
var docIndex = {};

// contains a multi-level map mapping languages to validators to docs
var docDetails = {};

// whether or not all of the documentation has been merged
var docsMerged = false;

// the annotation module
var annotate = {};

/**
 * Builds the documentation index for each language supported by the system
 * by entering each language directory in the site content and searching
 * for a site/views/docs directory.
 *
 * @param callback called when the documentation indexing has started.
 */
api.buildDocumentationIndex = function(callback) {
  var paths = [];

  // search for documentation files in all content directories
  var contentPaths = bedrock.config.website.views.paths;
  if(!Array.isArray(contentPaths)) {
    contentPaths = [contentPaths];
  }
  for(var i = 0; i < contentPaths.length; ++i) {
    var docPath = path.resolve(path.join(contentPaths[i], '/docs'));
    try {
      var stats = fs.statSync(docPath);
      if(stats) {
        paths.push(docPath);
      }
    }
    catch(ex) {
      // ignore exceptions for directories that don't exist
    }
  }

  // build the documentation index for all languages
  for(var i = 0; i < paths.length; ++i) {
    (function(docPath) {
      fs.readdir(docPath, function(err, files) {
        if(err) {
          bedrock.logger.error(
            'Failed to read documentation directory: ' + docPath, err);
          return;
        }

        // index all files that end in .html that are not index.html
        for(var f in files) {
          var filename = files[f];
          if(path.extname(filename) === '.html' && filename !== 'index.html') {
            var rfilename = path.resolve(path.join(docPath, filename));
            _addDocsToIndex(rfilename);
          }
        }
      });
    })(paths[i]);
  }

  /* There is a chance that all of the documentation indexes won't be built
   * by the time the server comes up. This is fine. The alternative is to
   * pause start-up until all documentation is indexed. In the worst case,
   * a developer would hit the /docs while the system is coming online
   * and see only partial documentation. A refresh of the page would show
   * all of the documentation.
   */
  callback();
};

/**
 * Retrieve all of the annotations for the system.
 *
 * @returns a map of maps where the first map is keyed by HTTP verbs and the
 *   second-level map is keyed by HTTP URL paths from the root of the server.
 *   Each entry contains an annotations object.
 */
api.getAnnotations = function() {
  // FIXME: 'docs' is undefined
  return docs;
};

/**
 * Get all categories for the documentation.
 *
 * @param lang the language.
 */
api.getCategories = function() {
  return Object.keys(docIndex);
};

/**
 * Get the documentation index for a particular language.
 *
 * @param lang the language.
 */
api.getDocIndex = function() {
  // FIXME: doc info may be merged before all docs read off of disk
  // merge the documentation registration info w/ the doc info from disk
  if(!docsMerged) {
    for(var category in docIndex) {
      for(var docFile in docIndex[category]) {
        if(!(docFile in docDetails)) {
          docDetails[docFile] = {};
        }
        docIndex[category][docFile]['method'] = docDetails[docFile].method;
        docIndex[category][docFile]['path'] = docDetails[docFile].path;
      }
    }

    // clean out documentation that doesn't have a registered endpoint
    for(var category in docIndex) {
      for(var docFile in docIndex[category]) {
        if(!docIndex[category][docFile]['path']) {
          delete docIndex[category][docFile];
        }
      }
      if(Object.keys(docIndex[category]).length < 1) {
        delete docIndex[category];
      }
    }
    docsMerged = true;
  }

  return docIndex;
};

/**
 * Retrieves the details associated with a particular documentation file.
 *
 * @param docFile the name of the file, excluding the .html extension.
 */
api.getDetails = function(docFile) {
  return docDetails[docFile];
};

/**
 * Documents a particular method and path of the system.
 *
 * @param method the HTTP method name.
 * @param path the HTTP path from the root of the server. The path may include
 *   named variables like /i/:identity.
 * @param docFile the name of the associated document file in the
 *   views/docs/ directory.
 */
api.document = function(method, path, docFile) {
  if(!(docFile in docDetails)) {
    docDetails[docFile] = {};
  }
  docDetails[docFile].method = method;
  docDetails[docFile].path = path;
};

// short-hand aliases for the documentation methods
annotate.get = function(path, docFile) {
  api.document('get', path, docFile);
};

annotate.post = function(path, docFile) {
  api.document('post', path, docFile);
};

annotate.put = function(path, docFile) {
  api.document('put', path, docFile);
};

annotate.del = function(path, docFile) {
  api.document('delete', path, docFile);
};

api.annotate = annotate;

/**
 * Adds a documentation index entry for the specified filename.
 *
 * @param filename the filename to scan for index information.
 */
function _addDocsToIndex(filename) {
  fs.readFile(filename, 'utf-8', function(err, data) {
    if(err) {
      bedrock.logger.error(
        'Failed to index documentation file: ' + filename, err);
      return;
    }

    // search the file for information that should go into the index
    var shortName = path.basename(filename, '.html');
    var category = data.match(/\s*category\s*=\s*"(.*)"/);
    var description = data.match(/\s*shortDescription\s*=\s*"(.*)"/);
    var validator = data.match(/\s*validator\s*=\s*"(.*)"/);
    category = category ? category[1] : 'Unknown';
    description = description ? description[1] : 'UNDOCUMENTED';
    validator = validator ? validator[1] : null;

    // add the category and description to the index
    if(!(category in docIndex)) {
      docIndex[category] = {};
    }

    // add the other information to the index
    var docs = {
      category: category,
      shortDescription: description
    };
    docIndex[category][shortName] = docs;
    docDetails[shortName] = docs;

    // build the validation HTML if the validator exists
    if(validator) {
      var schema = bedrock.validation.getSchema(validator);
      if(schema) {
        var validatorHtml = _generateValidatorHtml(schema);
        docs.validator = validator;
        docs.validatorHtml = validatorHtml;
      }
    }
  });
}

/**
 * Generates appropriate HTML developer documentation for a JSON Schema
 * validator.
 *
 * @param schema the JSON Schema to convert to HTML.
 *
 * @return the HTML block describing the expected input.
 */
function _generateValidatorHtml(schema) {
  var html = '<div class="validator-description">';
  html += _serializeJsonSchemaObject(schema, 0);
  html += '</div>';
  return html;
}

/**
 * Serializes a JSON Schema object into an HTML string.
 *
 * @param obj the JSON Schema object to serialize.
 * @param indent indents the serialization by the given number of ems.
 *
 * @returns the formatted HTML string.
 */
function _serializeJsonSchemaObject(obj, indent) {
  var html = '';
  if(obj.type && typeof obj.type === 'object' && obj.type.length) {
    var length = obj.type.length;
    for(var i = 0; i < length; i++) {
      html += _serializeJsonSchemaObject(obj.type[i], indent);
      if(i < (length - 1)) {
        html += '<div>or</div>';
      }
    }
  } else {
    html = util.format(
    '<div class="indent%s"><strong>%s</strong>: %s</div><div>{</div>',
    indent, obj.title, obj.description);
    html += _serializeJsonSchemaProperties(obj.properties, indent + 1);
    html += '<div>}</div>';
  }

  return html;
}

/**
 * Serializes a set of JSON Schema properties into an HTML string.
 *
 * @param properties the JSON Schema properties to serialize.
 * @param indent indents the serialization by the given number of ems.
 *
 * @returns the formatted HTML string.
 */
function _serializeJsonSchemaProperties(properties, indent) {
  var html = '';

  for(var p in properties) {
    var prop = properties[p];
    html += util.format(
      '<div class="indent%s"><strong>%s</strong> (%s): %s - %s',
      indent, p, prop.required ? 'required' : 'optional', prop.title,
      prop.description);
    if(prop.type === 'string') {
      html += _serializeJsonSchemaString(prop, indent+2);
    } else if(prop.type === 'integer') {
      html += _serializeJsonSchemaInteger(prop, indent+2);
    } else if(prop.type === 'object') {
      html += _serializeJsonSchemaObject(prop, indent+2);
    } else if(typeof(prop.type) === 'object') {
      for(var pt in prop.type) {
        var subprop = prop.type[pt];
        if(subprop.type === 'string') {
          html += _serializeJsonSchemaString(subprop, indent+2);
        }
      }
    } else {
      html += '<pre>' + JSON.stringify(prop, null, 2) + '</pre>';
    }
    html += '</div>';
  }

  return html;
}

/**
 * Serializes a JSON Schema string property into an HTML string.
 *
 * @param prop the JSON Schema property to serialize.
 * @param indent indents the serialization by the given number of ems.
 *
 * @returns the formatted HTML string.
 */
function _serializeJsonSchemaString(prop, indent) {
  var html = '';
  var minLength = prop.minLength ? prop.minLength : 0;
  var maxLength = prop.maxLength ? prop.maxLength : INFINITY;

  html += util.format('<div class="validator-string indent%s">A', indent);

  if(minLength === 0 && maxLength === INFINITY) {
    html += ' string';
  } else if(minLength === 1 && maxLength === INFINITY) {
    html += ' non-zero length string';
  } else if(minLength === maxLength) {
    html += util.format(' %s character string', minLength);
  } else {
    html += util.format(' %s-%s character string', minLength, maxLength);
  }

  if(prop.pattern) {
    html += util.format(
      ' that matches the regular expression "%s"', prop.pattern);
  }

  if(prop.enum) {
    html += ' that is one of the following values; ';
    for(var i in prop.enum) {
      if(i > 0) {
        html += ', ';
      }
      if(i == prop.enum.length - 1) {
        html += ' or ';
      }
      html += '"' + prop.enum[i] + '"';
    }
  }
  html += '.</div>';

  return html;
}

/**
 * Serializes a JSON Schema integer property into an HTML string.
 *
 * @param prop the JSON Schema property to serialize.
 * @param indent indents the serialization by the given number of ems.
 *
 * @returns the formatted HTML string.
 */
function _serializeJsonSchemaInteger(prop, indent) {
  var html = '';

  html += util.format(
    '<div class="validator-string indent%s">An integer', indent);

  if(prop.exclusiveMinimum) {
    html += ' greater than';
  }
  if(prop.minimum) {
    html += prop.minimum;
  }

  html += '.</div>';

  return html;
}
