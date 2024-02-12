/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {config} from './config.js';
import {serializeError} from 'serialize-error';
import util from 'node:util';

// export config utilities under `config` namespace
export * as config from './configUtil.js';

// BedrockError class
export const BedrockError = function(
  message = 'An unspecified error occurred.', ...args) {
  Error.call(this, message);
  Error.captureStackTrace(this, this.constructor);

  let options;
  if(args[0]) {
    // legacy unnamed parameters
    if(typeof args[0] !== 'object') {
      options = {
        name: args[0],
        details: args[1],
        cause: args[2]
      };
    } else {
      // named parameters
      options = args[0];
    }
  } else {
    options = {};
  }

  if(options.name && typeof options.name !== 'string') {
    throw new TypeError('"name" must be a string.');
  }

  this.name = options.name ?? 'OperationError';
  this.message = message;
  this.details = options.details ?? null;
  this.cause = options.cause ?? null;
};
util.inherits(BedrockError, Error);
BedrockError.prototype.name = 'BedrockError';
BedrockError.prototype.toObject = function(options = {}) {
  options.public = options.public ?? false;
  // convert error to object
  return _toObject(this, options);
};

const _genericErrorJSON = {
  message: 'An unspecified error occurred.',
  name: 'OperationError',
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

  // include `type` as `name` for better backwards compatibility
  if(!object.type) {
    object.type = object.name;
  }

  return object;
}

function _isErrorPublic(err) {
  return err instanceof BedrockError && err?.details?.public;
}
