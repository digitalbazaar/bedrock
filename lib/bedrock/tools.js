/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var util = require('util');
var jsonld = require('./jsonld'); // use locally-configured jsonld
var bedrock = {
  config: require('../config')
};

var api = {};
module.exports = api;

// BedrockError class
api.BedrockError = function(message, type, details, cause) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = type;
  this.message = message;
  this.details = details || null;
  this.cause = cause || null;
};
util.inherits(api.BedrockError, Error);
api.BedrockError.prototype.name = 'BedrockError';
api.BedrockError.prototype.toObject = function(options) {
  options = options || {};
  options.public = options.public || false;

  // convert error to object
  var rval = _toObject(this, options);

  // add stack trace only for non-public development conversion
  if(!options.public && bedrock.config.environment === 'development') {
    rval.stack = this.stack;
  }

  return rval;
};
// check type of this error
api.BedrockError.prototype.isType = function(type) {
  return jsonld.hasValue(this, 'name', type);
};
// check type of this error or one of it's causes
api.BedrockError.prototype.hasType = function(type) {
  return this.isType(type) || this.hasCauseOfType(type);
};
// check type of error cause or one of it's causes
api.BedrockError.prototype.hasCauseOfType = function(type) {
  if(this.cause && this.cause instanceof api.BedrockError) {
    return this.cause.hasType(type);
  }
  return false;
};

var _genericErrorJSON = {
  message: 'An internal server error occurred.',
  type: 'bedrock.common.InternalServerError'
};

function _toObject(err, options) {
  if(!err) {
    return null;
  }

  if(options.public) {
    // public conversion
    // FIXME also check if a validation type?
    if(err instanceof api.BedrockError &&
      err.details && err.details.public) {
      var details = api.clone(err.details);
      delete details.public;
      // mask cause if it is not a public bedrock error
      var cause = err.cause;
      if(!(cause && cause instanceof api.BedrockError &&
        cause.details && cause.details.public)) {
        cause = null;
      }
      return {
        message: err.message,
        type: err.name,
        details: details,
        cause: _toObject(cause, options)
      };
    }
    else {
      // non-bedrock error or not public, return generic error
      return _genericErrorJSON;
    }
  }
  else {
    // full private conversion
    if(err instanceof api.BedrockError) {
      return {
        message: err.message,
        type: err.name,
        details: err.details,
        cause: _toObject(err.cause, options)
      };
    }
    else {
      return {
        message: err.message,
        type: err.name,
        details: {
          inspect: util.inspect(err, false, 10),
          stack: err.stack
        },
        cause: null
      };
    }
  }
}

/**
 * Gets the passed date in W3C format (eg: 2011-03-09T21:55:41Z).
 *
 * @param date the date.
 *
 * @return the date in W3C format.
 */
api.w3cDate = function(date) {
  if(date === undefined || date === null) {
    date = new Date();
  }
  else if(typeof date === 'number' || typeof date === 'string') {
    date = new Date(date);
  }
  return util.format('%d-%s-%sT%s:%s:%sZ',
    date.getUTCFullYear(),
    _zeroFill(date.getUTCMonth() + 1),
    _zeroFill(date.getUTCDate()),
    _zeroFill(date.getUTCHours()),
    _zeroFill(date.getUTCMinutes()),
    _zeroFill(date.getUTCSeconds()));
};

function _zeroFill(num) {
  return (num < 10) ? '0' + num : '' + num;
}

/**
 * Merges the contents of one or more objects into the first object.
 *
 * @param deep (optional), true to do a deep-merge.
 * @param target the target object to merge properties into.
 * @param objects N objects to merge into the target.
 *
 * @return the default Bedrock JSON-LD context.
 */
api.extend = function() {
  var deep = false;
  var i = 0;
  if(arguments.length > 0 && typeof arguments[0] === 'boolean') {
    deep = arguments[0];
    ++i;
  }
  var target = arguments[i] || {};
  for(; i < arguments.length; ++i) {
    var obj = arguments[i] || {};
    Object.keys(obj).forEach(function(name) {
      var value = obj[name];
      if(deep && api.isObject(value) && !Array.isArray(value)) {
        target[name] = api.extend(true, target[name], value);
      }
      else {
        target[name] = value;
      }
    });
  }
  return target;
};

/**
 * Returns true if the given value is an Object.
 *
 * @param value the value to check.
 *
 * @return true if it is an Object, false if not.
 */
api.isObject = function(value) {
  return (Object.prototype.toString.call(value) === '[object Object]');
};

/**
 * Clones a value. If the value is an array or an object it will be deep cloned.
 *
 * @param value the value to clone.
 *
 * @return the clone.
 */
api.clone = function(value) {
  if(value && typeof value === 'object') {
    var rval = Array.isArray(value) ? new Array(value.length) : {};
    for(var i in value) {
      rval[i] = api.clone(value[i]);
    }
    return rval;
  }
  return value;
};

/**
 * Generates a new v4 UUID.
 *
 * @return the new v4 UUID.
 */
api.uuid = function() {
  // taken from: https://gist.github.com/1308368
  return (function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b;})();
};
