/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import {config as brConfig} from './config.js';
import lodashGet from 'lodash.get';
import lodashSet from 'lodash.set';
import lodashTemplate from 'lodash.template';
import lodashToPath from 'lodash.topath';

/**
 * Wrapper with helpers for config objects.
 *
 * @param {object} object - The config object.
 * @param {object} [options={}] - The options to use:
 *   config: parent config object
 *   locals: object containing variables used for string templates.
 *     Defaults to main config object.
 */
export const Config = function(object, options = {}) {
  this.object = object;
  this.options = options;
};

/**
 * Set a path to a value.
 *
 * Multiple paths can be set at once with an object with many string path keys
 * and associated values.
 *
 * @param {string} path - A lodash-style string or array path, or an object
 *   with many path key and value pairs.
 * @param {*} value - The value to set at the path when using single path.
 */
Config.prototype.set = function(path, value) {
  if(!_isPath(path)) {
    Object.keys(path).forEach(key => lodashSet(this.object, key, path[key]));
    return;
  }
  lodashSet(this.object, path, value);
};

/**
 * Set a path to a default value if it does not exist. All elements of the path
 * will be initialized as an empty object if they do not exist.
 *
 * Multiple paths can be set at once with an object with many string path keys
 * and associated default values.
 *
 * Note: To initialize the final element of a path to the empty object even if
 * it already exists, use `c.set(path, {})`.
 *
 * @param {string} path - A lodash-style string or array path, or an object
 *   with many path key and default value pairs.
 * @param {*} value - The default value to set at the path when using a single
 *   path.
 *
 * @returns {*} The last element of the path or a path indexed object with
 *   element values.
 */
Config.prototype.setDefault = function(path, value) {
  if(!_isPath(path)) {
    const paths = {};
    Object.keys(path).forEach(key => {
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
 * @param {string} path - A lodash-style string or array path, or an object
 *   with many path key and value pairs.
 * @param {Function|string} fnOrExpression - A lodash template or a function
 *   used to compute the path value.
 * @param {object} [options] - The options to use:
 *   locals: object containing variables used for string templates
 *   parentDefault: value for parent if it does not exist.
 *
 * @returns {*} The result.
 */
Config.prototype.setComputed = function(path, fnOrExpression, options) {
  if(!_isPath(path)) {
    options = fnOrExpression;
    Object.keys(path).forEach(key => this.setComputed(
      key, path[key], options));
    return;
  }
  if(typeof fnOrExpression === 'string') {
    // handle strings as templates
    fnOrExpression = lodashTemplate(fnOrExpression);
  } else if(typeof fnOrExpression !== 'function') {
    // handle non-string non-functions as simple values
    return this.set(path, fnOrExpression);
  }
  // ensure path is array
  if(typeof path === 'string') {
    path = lodashToPath(path);
  }
  // locals
  options = options || {};
  const locals = options.locals || this.options.locals || brConfig;
  // get target object path
  const targetPath = path.slice(0, -1);
  // get key
  const targetKey = path.slice(-1);
  // get or create target parent object
  const parentDefault = options.parentDefault || {};
  const target = _setDefault(this.object, targetPath, parentDefault);
  // setup property
  let _isSet = false;
  let _value;
  Object.defineProperty(target, targetKey, {
    configurable: true,
    enumerable: true,
    get: () => {
      if(_isSet) {
        return _value;
      }
      return fnOrExpression(locals);
    },
    set: value => {
      _isSet = true;
      _value = value;
    }
  });
};

/**
 * Create a bound setComputed function for this Config instance. Used to
 * simplify code. Example:
 *
 * let cc = bedrock.util.config.main.computer();
 * cc('...', ...);
 * .
 *
 * @returns {Function} The bound `setComputed` function.
 */
Config.prototype.computer = function() {
  return this.setComputed.bind(this);
};

/**
 * Push a getter to an array specified by a config path. See setComputed for an
 * explaination of how getters work.
 *
 * @param {string} path - A lodash-style string or array path.
 * @param {Function|string} fnOrExpression - A lodash template or a function
 *   used to compute the path value.
 * @param {object} [options] - The options to use:
 *   locals: object containing variables used for string templates.
 */
Config.prototype.pushComputed = function(
  path, fnOrExpression, options) {
  // get target or default array
  const target = lodashGet(this.object, path, []);
  // add next index
  const pushPath = lodashToPath(path);
  pushPath.push(target.length);
  // use default parent array
  const pushOptions = Object.assign({}, options, {parentDefault: []});
  // set computed array element
  this.setComputed(pushPath, fnOrExpression, pushOptions);
};

/**
 * Shared wrapper for the standard bedrock config.
 */
export const main = new Config(brConfig);

// check if argument looks like a string or array path
function _isPath(maybePath) {
  return typeof maybePath === 'string' || Array.isArray(maybePath);
}

// set default for path if it does not exist
function _setDefault(object, path, value) {
  // ensure path is array
  if(typeof path === 'string') {
    path = lodashToPath(path);
  }
  if(path.length) {
    let target = lodashGet(object, path);
    if(!target) {
      target = value;
      lodashSet(object, path, target);
    }
    return target;
  } else {
    return object;
  }
}
