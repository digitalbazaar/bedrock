/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */

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

// replacement for lodash.get
export function getByPath(target, path, defaultValue) {
  const parsed = Array.isArray(path) ?
    path : path.split(/[.[\]]/).filter(Boolean);
  const value = parsed.reduce((value, key) => {
    _assertNoProto(key);
    return value?.[key];
  }, target);
  return value !== undefined ? value : defaultValue;
}

// replacment for lodash.set
export function setByPath(target, path, value) {
  const parsed = Array.isArray(path) ?
    path : path.split(/[.[\]]/).filter(Boolean);
  const last = parsed.pop();
  for(const key of parsed) {
    _assertNoProto(key);
    target = target[key] = target[key] || {};
  }
  _assertNoProto(last);
  target[last] = value;
}

export function hasValue(obj, key, value) {
  const t = obj[key];
  if(Array.isArray(t)) {
    return t.includes(value);
  }
  return t === value;
}

function _assertNoProto(key) {
  if(key === '__proto__') {
    throw new Error('"__proto__" not allowed in path.');
  }
}
