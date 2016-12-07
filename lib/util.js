/*
 * Copyright (c) 2012-2016 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('lodash');
var config = require('./config');
var util = require('util');
var jsonld = require('./jsonld'); // use locally-configured jsonld

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
  if(!options.public && config.core.errors.showStack) {
    // try a basic parse
    rval.stack = _parseStack(this.stack);
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
  type: 'bedrock.InternalServerError'
};

var _errorMessageRegex = /^Error:\s*/;
var _errorAtRegex = /^\s+at\s*/;
/**
 * Parse an Error stack property into a JSON structure.
 *
 * NOTE: Uses some format heuristics and may be fooled by tricky errors.
 *
 * TODO: look into better stack parsing libraries.
 */
function _parseStack(stack) {
  try {
    var lines = stack.split('\n');
    var messageLines = [];
    var atLines = [];
    for(var i = 0; i < lines.length; ++i) {
      var line = lines[i];
      // push location-like lines to a stack array
      if(line.match(_errorAtRegex)) {
        atLines.push(line.replace(_errorAtRegex, ''));
      } else {
        // push everything else to a message array
        messageLines.push(line.replace(_errorMessageRegex, ''));
      }
    }
    return {
      message: messageLines.join('\n'),
      at: atLines
    };
  } catch(e) {
    // FIXME: add parse error handling
    return stack;
  }
}

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
    } else {
      // non-bedrock error or not public, return generic error
      return _genericErrorJSON;
    }
  } else {
    // full private conversion
    if(err instanceof api.BedrockError) {
      return {
        message: err.message,
        type: err.name,
        details: err.details,
        cause: _toObject(err.cause, options)
      };
    } else {
      return {
        message: err.message,
        type: err.name,
        details: {
          inspect: util.inspect(err, false, 10),
          stack: _parseStack(err.stack)
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
  } else if(typeof date === 'number' || typeof date === 'string') {
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
  i++;
  for(; i < arguments.length; ++i) {
    var obj = arguments[i] || {};
    Object.keys(obj).forEach(function(name) {
      var value = obj[name];
      if(deep && api.isObject(value) && !Array.isArray(value)) {
        target[name] = api.extend(true, target[name], value);
      } else {
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
    var rval;
    if(Array.isArray(value)) {
      rval = new Array(value.length);
      for(var i = 0; i < rval.length; i++) {
        rval[i] = api.clone(value[i]);
      }
    } else {
      rval = {};
      for(var j in value) {
        rval[j] = api.clone(value[j]);
      }
    }
    return rval;
  }
  return value;
};

// config utilities

// config namespace
api.config = {};

// check if argument looks like a string or array path
function _isPath(maybePath) {
  return typeof maybePath === 'string' || Array.isArray(maybePath);
}
// set default for path if it does not exist
function _setDefault(object, path, value) {
  // ensure path is array
  if(typeof path === 'string') {
    path = _.toPath(path);
  }
  if(path.length) {
    let target = _.get(object, path);
    if(!target) {
      target = value;
      _.set(object, path, target);
    }
    return target;
  } else {
    return object;
  }
}

/**
 * Wrapper with helpers for config objects.
 *
 * @param object the config object.
 * @param [options] options to use:
 *          config: parent config object
 *          locals: object containing variables used for string templates.
 *                  Defaults to main config object.
 */
api.config.Config = function(object, options) {
  this.object = object;
  this.options = options || {};
};

/**
 * Set a path to a value.
 *
 * Multiple paths can be set at once with an object with many string path keys
 * and associated values.
 *
 * @param path lodash-style string or array path, or an object with many path
 *          key and value pairs.
 * @param value value to set at the path when using single path.
 */
api.config.Config.prototype.set = function(path, value) {
  if(!_isPath(path)) {
    Object.keys(path).forEach(key => _.set(this.object, key, path[key]));
    return;
  }
  _.set(this.object, path, value);
};

/**
 * Set a path to a default value if it does not exist. All elements of the path
 * will be initialized as an empty object if they do not exist.
 *
 * Multiple paths can be set at once with an object with many string path keys
 * and associated default values;
 *
 * Note: To initialize the final element of a path to the empty object even if
 * it already exists, use c.set(path, {});
 *
 * @param path lodash-style string or array path, or an object with many path
 *          key and default value pairs.
 * @param value default value to set at the path when using a single path.
 * @return the last element of the path or a path indexed object with element
 *           values.
 */
api.config.Config.prototype.setDefault = function(path, value) {
  if(!_isPath(path)) {
    var paths = {};
    Object.keys(path).forEach((key) => {
      paths[key] = _setDefault(this.object, key, path[key]);
    });
    return paths;
  }
  return _setDefault(this.object, path, value);
};

/**
 * Assigns a getter to a config path. When the config path is read, the getter
 * will execute and compute the configured value. This is particularly useful
 * for config values that depend on other config values; it removes the need
 * to update such a value when its dependencies change.
 *
 * The value can be computed from a function or from a lodash template that
 * will be evaluated using `bedrock.config` for its local variables.
 *
 * @param path lodash-style string or array path, or an object with many path
 *          key and value pairs.
 * @param fnOrExpression a lodash template or a function used to compute the
 *          path value.
 * @param [options] options to use:
 *          locals: object containing variables used for string templates.
 *          parentDefault: value for parent if it does not exist.
 */
api.config.Config.prototype.setComputed =
  function(path, fnOrExpression, options) {
  if(!_isPath(path)) {
    options = fnOrExpression;
    Object.keys(path).forEach(key => this.setComputed(key, path[key], options));
    return;
  }
  if(typeof fnOrExpression === 'string') {
    // handle strings as templates
    fnOrExpression = _.template(fnOrExpression);
  } else if(typeof fnOrExpression !== 'function') {
    // handle non-string non-functions as simple values
    return this.set(path, fnOrExpression);
  }
  // ensure path is array
  if(typeof path === 'string') {
    path = _.toPath(path);
  }
  // locals
  options = options || {};
  var locals = options.locals || this.options.locals || config;
  // get target object path
  var targetPath = path.slice(0, -1);
  // get key
  var targetKey = path.slice(-1);
  // get or create target parent object
  var parentDefault = options.parentDefault || {};
  var target = _setDefault(this.object, targetPath, parentDefault);
  // setup property
  var _isSet = false;
  var _value;
  Object.defineProperty(target, targetKey, {
    configurable: true,
    enumerable: true,
    get: () => {
      if(_isSet) {
        return _value;
      }
      return fnOrExpression(locals);
    },
    set: (value) => {
      _isSet = true;
      _value = value;
    }
  });
};

/**
 * Create a bound setComputed function for this Config instance. Used to
 * simplify code.
 *
 * let cc = bedrock.util.config.main.computer();
 * cc('...', ...);
 *
 * @return bound setComputed function.
 */
api.config.Config.prototype.computer = function() {
  return this.setComputed.bind(this);
};

/**
 * Push a getter to an array specified by a config path. See setComputed for an
 * explaination of how getters work.
 *
 * @param path lodash-style string or array path.
 * @param fnOrExpression a lodash template or a function used to compute the
 *          path value.
 * @param [options] options to use:
 *          locals: object containing variables used for string templates.
 */
api.config.Config.prototype.pushComputed =
  function(path, fnOrExpression, options) {
  // get target or default array
  let target = _.get(this.object, path, []);
  // add next index
  let pushPath = _.toPath(path);
  pushPath.push(target.length);
  // use default parent array
  let pushOptions = Object.assign({}, options, {parentDefault: []});
  // set computed array element
  this.setComputed(pushPath, fnOrExpression, pushOptions);
};

/**
 * Shared wrapper for the standard bedrock config.
 */
api.config.main = new api.config.Config(config);

/**
 * Generates a new v4 UUID.
 *
 * @return the new v4 UUID.
 */
api.uuid = function() {
  // jscs: disable
  // taken from: https://gist.github.com/1308368
  return (function(a,b){for(b=a='';a++<36;b+=a*51&52?(a^15?8^Math.random()*(a^20?16:4):4).toString(16):'-');return b;})();
  // jscs: enable
};

/**
 * Parse the string or value and return a boolean value or raise an exception.
 * Handles true and false booleans and case-insensitive 'yes', 'no', 'true',
 * 'false', 't', 'f', '0', '1' strings.
 *
 * @param value a string of value.
 *
 * @return the boolean conversion of the value.
 */
api.boolify = function(value) {
  if(typeof value === 'boolean') {
    return value;
  }
  if(typeof value === 'string' && value) {
    switch(value.toLowerCase()) {
      case 'true':
      case 't':
      case '1':
      case 'yes':
      case 'y':
        return true;
      case 'false':
      case 'f':
      case '0':
      case 'no':
      case 'n':
        return false;
    }
  }
  // if here we couldn't parse it
  throw new Error('Invalid boolean:' + value);
};
