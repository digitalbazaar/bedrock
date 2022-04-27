/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from './config.js';
import {clone, hasValue} from './helpers.js';
import util from 'util';

// export config utilities under `config` namespace
export * as config from './configUtil.js';

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
