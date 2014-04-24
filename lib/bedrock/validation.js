/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var fs = require('fs');
var jsonschema = require('json-schema');
var PATH = require('path');
var bedrock = {
  config: require('../config'),
  tools: require('./tools')
};
var BedrockError = bedrock.tools.BedrockError;

var ERROR_TYPE = 'bedrock.validation';

var api = {};
module.exports = api;

// available schemas
var schemas = api.schemas = {};

/**
 * Initializes the validation system: loads all schemas, etc.
 */
api.init = function() {
  // load logger during init
  bedrock.logger = require('./loggers').get('app');

  // schemas to skip loading
  var skip = bedrock.config.validation.schema.skip.slice();
  // TODO: move to production config
  if(bedrock.config.environment !== 'development') {
    skip.push('services.test.js');
  }

  // load all schemas
  var schemaDirs = bedrock.config.validation.schema.paths;
  var jsExt = '.js';
  schemaDirs.forEach(function(schemaDir) {
    schemaDir = PATH.resolve(schemaDir);
    bedrock.logger.debug('loading schemas from: ' + schemaDir);
    fs.readdirSync(schemaDir).filter(function(file) {
      var js = PATH.extname(file) === jsExt;
      var use = skip.indexOf(file) === -1;
      return js && use;
    }).forEach(function(file) {
      var name = PATH.basename(file, PATH.extname(file));
      var module = require(PATH.join(schemaDir, file));
      if(typeof module === 'function') {
        if(name in schemas) {
          bedrock.logger.debug(
            'overwriting schema "' + name + '" with ' +
            PATH.resolve(schemaDir, file));
        }
        schemas[name] = module;
        schemas[name].instance = module();
        bedrock.logger.debug('loaded schema: ' + name);
      } else {
        for(var key in module) {
          var tmp = name + '.' + key;
          if(tmp in schemas) {
            bedrock.logger.debug(
              'overwriting schema "' + tmp + '" with ' + file);
          }
          schemas[tmp] = module[key];
          schemas[tmp].instance = schemas[tmp]();
          bedrock.logger.debug('loaded schema: ' + tmp);
        }
      }
    });
  });
};

/**
 * This method takes one or three parameters.
 *
 * If only one parameter is given, returns express middleware that will be
 * used to validate a request using the schema associated with the given name.
 *
 * If a string is provided for the first parameter, then it will be used
 * as the schema name for validating the request body.
 *
 * If an object is provided for the first parameter, then the object can
 * contain 'body' and 'query' schema names as properties of the object.
 *
 * If three parameters are given, the first parameter must be a string,
 * the second parameter must be the data to validate and the third must be
 * function to be called once the validation operation completes.
 *
 * @param name the name of the schema to use (or an object with names).
 * @param [data] the data to validate.
 * @param [callback(err)] called once the operation completes.
 */
api.validate = function(name, data, callback) {
  var options = {};

  if(typeof name === 'object') {
    if('body' in name) {
      options.body = name.body;
    }
    if('query' in name) {
      options.query = name.query;
    }
  } else {
    options.body = name;
  }

  // look up schema(s) by name
  var schemas = {};
  var notFound = null;
  Object.keys(options).forEach(function(key) {
    schemas[key] = api.getSchema(options[key]);
    if(!notFound && !schemas[key]) {
      notFound = options[key];
    }
  });

  // do immediate validation if data and callback are present
  if(arguments.length === 3) {
    if(notFound) {
      return callback(new BedrockError(
        'Could not validate data; unknown schema name (' + notFound + ').',
        ERROR_TYPE + '.UnknownSchema', {schema: notFound}));
    }
    // use schema.body (assume 3 parameter is called w/string)
    return api.validateInstance(data, schemas.body, callback);
  }

  // schema does not exist, return middle that raises error
  if(notFound) {
    return function(req, res, next) {
      next(new BedrockError(
        'Could not validate request; unknown schema name (' + notFound + ').',
        ERROR_TYPE + '.UnknownSchema', {schema: notFound}));
    };
  }

  // return validation middleware
  return function(req, res, next) {
    async.waterfall([
      function(callback) {
        if(schemas.query) {
          return api.validateInstance(req.query, schemas.query, callback);
        }
        callback();
      },
      function(callback) {
        if(schemas.body) {
          return api.validateInstance(req.body, schemas.body, callback);
        }
        callback();
      }
    ], next);
  };
};

/**
 * Retrieves a validation schema given a name for the schema.
 *
 * @param name the name of the schema to retrieve.
 *
 * @return the object for the schema, or null if the schema doesn't exist.
 */
api.getSchema = function(name) {
  var schema = null;
  if(name in api.schemas) {
    schema = api.schemas[name].instance;
  }
  return schema;
};

/**
 * Validates an instance against a schema.
 *
 * @param instance the instance to validate.
 * @param schema the schema to use.
 * @param callback(err) called once the operation completes.
 */
api.validateInstance = function(instance, schema, callback) {
  // do validation
  var result = jsonschema(instance, schema);
  if(result.valid) {
    return callback();
  }

  // create public error messages
  var errors = [];
  result.errors.forEach(function(error) {
    // create custom error details
    var details = {
      path: error.property,
      'public': true
    };
    details.schema = {
      title: error.schema.title || '',
      description: error.schema.description || ''
    };
    // include custom errors or use default
    details.errors = error.schema.errors || {
      invalid: 'Invalid input.',
      missing: 'Missing input.'
    };
    if(error.value) {
      if(error.schema.errors && 'mask' in error.schema.errors) {
        var mask = error.schema.errors.mask;
        if(mask === true) {
          details.value = '***MASKED***';
        } else {
          details.value = mask;
        }
      } else {
        details.value = error.value;
      }
    }

    // add bedrock validation error
    errors.push(new BedrockError(
      error.message, ERROR_TYPE + '.ValidationError', details));
  });

  var msg = schema.title ?
    'A validation error occured in the \''+ schema.title +'\' validator.' :
    'A validation error occured in an unnamed validator.';
  callback(new BedrockError(
    msg, ERROR_TYPE + '.ValidationError',
    {'public': true, errors: errors, httpStatusCode: 400}));
};
