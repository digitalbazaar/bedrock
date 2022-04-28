/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config} from './config.js';
import {hasValue} from './helpers.js';
import {serializeError} from 'serialize-error';
import util from 'util';

// export config utilities under `config` namespace
export * as config from './configUtil.js';

// BedrockError class
export const BedrockError = function(message, type, details, cause) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);
  this.name = type;
  this.type = type;
  this.message = message;
  this.details = details ?? null;
  this.cause = cause ?? null;
};
util.inherits(BedrockError, Error);
BedrockError.prototype.name = 'BedrockError';
BedrockError.prototype.toObject = function(options) {
  options = options ?? {};
  options.public = options.public ?? false;
  // convert error to object
  return _toObject(this, options);
};
// check type of this error
BedrockError.prototype.isType = function(type) {
  return hasValue(this, 'name', type);
};
// check type of this error or one of its causes
BedrockError.prototype.hasType = function(type) {
  return this.isType(type) || this.hasCauseOfType(type);
};
// check type of error cause or one of its causes
BedrockError.prototype.hasCauseOfType = function(type) {
  if(this?.cause instanceof BedrockError) {
    return this.cause.hasType(type);
  }
  return false;
};

const _genericErrorJSON = {
  message: 'An unspecified error occurred.',
  type: 'OperationError'
};

function _toObject(err, options, visited = new Set()) {
  visited.add(err);

  // if conversion is for public consumption but the error itself is not
  // public, then return a generic error
  if(options.public && !_isErrorPublic(err)) {
    return _genericErrorJSON;
  }

  // convert the top-level error
  const object = serializeError(err);

  // convert for public consumption (remove any private details)
  if(options.public) {
    // delete `public` property in details
    delete object?.details.public;

    // delete stack trace unless configured otherwise
    if(!config.core.errors.showStack) {
      delete object.stack;
    }

    // if the cause is not public, clear it
    if(err.cause && !_isErrorPublic(err.cause)) {
      object.cause = null;
    }
  }

  // convert any cause to an object (instead of a string) if not yet
  // visited (cycle detection)
  if(err.cause && !visited.has(err.cause)) {
    object.cause = _toObject(err.cause, options, visited);
  }

  // delete `name` from bedrock errors (include only `type` for better
  // backwards compatibility)
  if(err instanceof BedrockError) {
    delete object.name;
  }

  return object;
}

function _isErrorPublic(err) {
  return err instanceof BedrockError && err?.details?.public;
}
