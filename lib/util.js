/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from './config.js';
import delay from 'delay';
import util from 'util';
import uuid from 'uuid-random';

// export config utilities under `config` namespace
export * as config from './configUtil.js';

/**
 * Create a promise which resolves after the specified milliseconds.
 *
 * @see {@link https://github.com/sindresorhus/delay}
 */
export {delay};

// BedrockError class
export const BedrockError = function(message, type, details, cause) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = type;
  this.message = message;
  this.details = details || null;
  this.cause = cause || null;
};
util.inherits(BedrockError, Error);
BedrockError.prototype.name = 'BedrockError';
BedrockError.prototype.toObject = function(options) {
  options = options || {};
  options.public = options.public || false;

  // convert error to object
  const rval = _toObject(this, options);

  // add stack trace only for non-public development conversion
  if(!options.public && config.core.errors.showStack) {
    // try a basic parse
    rval.stack = _parseStack(this.stack);
  }

  return rval;
};
// check type of this error
BedrockError.prototype.isType = function(type) {
  return hasValue(this, 'name', type);
};
// check type of this error or one of it's causes
BedrockError.prototype.hasType = function(type) {
  return this.isType(type) || this.hasCauseOfType(type);
};
// check type of error cause or one of it's causes
BedrockError.prototype.hasCauseOfType = function(type) {
  if(this.cause && this.cause instanceof BedrockError) {
    return this.cause.hasType(type);
  }
  return false;
};

/**
 * Gets the passed date in W3C format (eg: 2011-03-09T21:55:41Z).
 *
 * @param {Date|string|number} [date=new Date] - The date; if passing a number
 *   use milliseconds since the epoch.
 *
 * @returns {string} The date in W3C format.
 */
export function w3cDate(date) {
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
}

function _zeroFill(num) {
  return (num < 10) ? '0' + num : '' + num;
}

/**
 * Merges the contents of one or more objects into the first object.
 *
 * Arguments:
 * `deep` (optional), true to do a deep-merge
 * `target` the target object to merge properties into
 * `objects` N objects to merge into the target.
 *
 * @returns {object} - The extended object.
 */
export function extend() {
  let deep = false;
  let i = 0;
  if(arguments.length > 0 && typeof arguments[0] === 'boolean') {
    deep = arguments[0];
    ++i;
  }
  const target = arguments[i] || {};
  i++;
  for(; i < arguments.length; ++i) {
    const obj = arguments[i] || {};
    Object.keys(obj).forEach(function(name) {
      const value = obj[name];
      if(deep && isObject(value) && !Array.isArray(value)) {
        target[name] = extend(true, target[name], value);
      } else {
        target[name] = value;
      }
    });
  }
  return target;
}

/**
 * Returns true if the given value is an Object.
 *
 * @param {*} value - The value to check.
 *
 * @returns {boolean} True if it is an Object, false if not.
 */
export function isObject(value) {
  return (Object.prototype.toString.call(value) === '[object Object]');
}

/**
 * Clones a value. If the value is an array or an object it will be deep
 * cloned.
 *
 * @param {*} value - The value to clone.
 *
 * @returns {*} The clone.
 */
export function clone(value) {
  if(value && typeof value === 'object') {
    let rval;
    if(Array.isArray(value)) {
      rval = new Array(value.length);
      for(let i = 0; i < rval.length; i++) {
        rval[i] = clone(value[i]);
      }
    } else {
      rval = {};
      for(const j in value) {
        rval[j] = clone(value[j]);
      }
    }
    return rval;
  }
  return value;
}

/**
 * Generates a new v4 UUID.
 *
 * @returns {string} The new v4 UUID.
 */
export {uuid};

/**
 * Parse the string or value and return a boolean value or raise an exception.
 * Handles true and false booleans and case-insensitive 'yes', 'no', 'true',
 * 'false', 't', 'f', '0', '1' strings.
 *
 * @param {string} value - The value to convert to a boolean.
 *
 * @returns {boolean} The boolean conversion of the value.
 */
export function boolify(value) {
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
}

export function callbackify(fn) {
  const callbackVersion = util.callbackify(fn);
  return function(...args) {
    const callback = args[args.length - 1];
    if(typeof callback === 'function') {
      return callbackVersion.apply(null, args);
    }
    return fn.apply(null, args);
  };
}

// a replacement for jsonld.hasValue
export function hasValue(obj, key, value) {
  const t = obj[key];
  if(Array.isArray(t)) {
    return t.includes(value);
  }
  return t === value;
}

const _genericErrorJSON = {
  message: 'An internal server error occurred.',
  type: 'bedrock.InternalServerError'
};

const _errorMessageRegex = /^Error:\s*/;
const _errorAtRegex = /^\s+at\s*/;

/**
 * Parse an Error stack property into an object structure that can be
 * serialized to JSON.
 *
 * NOTE: Uses some format heuristics and may be fooled by tricky errors.
 *
 * TODO: look into better stack parsing libraries.
 * See: https://github.com/digitalbazaar/bedrock/issues/87.
 *
 * @param {string} stack - The stack trace.
 *
 * @returns {object} Stack trace as an object.
 */
function _parseStack(stack) {
  try {
    const lines = stack.split('\n');
    const messageLines = [];
    const atLines = [];
    for(let i = 0; i < lines.length; ++i) {
      const line = lines[i];
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
    // see: https://github.com/digitalbazaar/bedrock/issues/87
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
    if(err instanceof BedrockError &&
      err.details && err.details.public) {
      const details = clone(err.details);
      delete details.public;
      // mask cause if it is not a public bedrock error
      let {cause} = err;
      if(!(cause && cause instanceof BedrockError &&
        cause.details && cause.details.public)) {
        cause = null;
      }
      return {
        message: err.message,
        type: err.name,
        details,
        cause: _toObject(cause, options)
      };
    } else {
      // non-bedrock error or not public, return generic error
      return _genericErrorJSON;
    }
  } else {
    // full private conversion
    if(err instanceof BedrockError) {
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
