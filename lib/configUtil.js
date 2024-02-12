/*!
 * Copyright (c) 2012-2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */
import {config as brConfig} from './config.js';
import {getByPath, setByPath, toPath} from './helpers.js';

const VAR_REGEX = /^[a-zA-Z_$][a-zA-Z_$0-9]*$/;

/**
 * Wrapper with helpers for config objects.
 *
 * @param {object} object - The config object.
 * @param {object} [options={}] - The options to use:
 *   config: parent config object
 *   locals: object containing variables used for string templates.
 *     Defaults to main config object.
 */
export class Config {
  constructor(object, options = {}) {
    this.object = object;
    this.options = options;
  }

  /**
   * Set a path to a value.
   *
   * Multiple paths can be set at once with an object with many string path
   * keys and associated values.
   *
   * @param {string} path - A lodash-style string or array path, or an object
   *   with many path key and value pairs.
   * @param {*} value - The value to set at the path when using single path.
   */
  set(path, value) {
    if(!_isPath(path)) {
      Object.keys(path).forEach(key => setByPath(this.object, key, path[key]));
      return;
    }
    setByPath(this.object, path, value);
  }

  /**
   * Set a path to a default value if it does not exist. All elements of the
   * path will be initialized as an empty object if they do not exist.
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
  setDefault(path, value) {
    if(!_isPath(path)) {
      const paths = {};
      Object.keys(path).forEach(key => {
        paths[key] = _setDefault(this.object, key, path[key]);
      });
      return paths;
    }
    return _setDefault(this.object, path, value);
  }

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
  setComputed(path, fnOrExpression, options) {
    if(!_isPath(path)) {
      options = fnOrExpression;
      Object.keys(path).forEach(key => this.setComputed(
        key, path[key], options));
      return;
    }
    if(typeof fnOrExpression === 'string') {
      // handle strings as templates
      fnOrExpression = _createTemplateFn(fnOrExpression);
    } else if(typeof fnOrExpression !== 'function') {
      // handle non-string non-functions as simple values
      return this.set(path, fnOrExpression);
    }
    // ensure path is array
    if(typeof path === 'string') {
      path = toPath(path);
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
      get() {
        if(_isSet) {
          return _value;
        }
        fnOrExpression._target = target;
        fnOrExpression._targetKey = targetKey;
        return fnOrExpression(locals);
      },
      set(value) {
        _isSet = true;
        _value = value;
      }
    });
  }

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
  computer() {
    return this.setComputed.bind(this);
  }

  /**
   * Push a getter to an array specified by a config path. See `setComputed`
   * for an explaination of how getters work.
   *
   * @param {string} path - A lodash-style string or array path.
   * @param {Function|string} fnOrExpression - A lodash template or a function
   *   used to compute the path value.
   * @param {object} [options] - The options to use:
   *   locals: object containing variables used for string templates.
   */
  pushComputed(path, fnOrExpression, options) {
    // get target or default array
    const target = getByPath(this.object, path, []);
    // add next index
    const pushPath = toPath(path);
    pushPath.push(target.length);
    // use default parent array
    const pushOptions = {...options, parentDefault: []};
    // set computed array element
    this.setComputed(pushPath, fnOrExpression, pushOptions);
  }
}

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
    path = toPath(path);
  }
  if(path.length) {
    let target = getByPath(object, path);
    if(!target) {
      target = value;
      setByPath(object, path, target);
    }
    return target;
  }
  return object;
}

// replacement for lodash.template
function _createTemplateFn(template) {
  let running = false;
  return function interpolate(vars) {
    // prevent cycles by returning `undefined` while `interpolate` is running
    if(running) {
      return;
    }
    running = true;
    // do not allow any invalid named vars
    const names = Object.keys(vars).filter(n => VAR_REGEX.test(n));
    const values = names.map(n => vars[n]);
    const fn = new Function(...names, `return \`${template}\`;`);
    const result = fn.call(template, ...values);
    running = false;
    return result;
  };
}
