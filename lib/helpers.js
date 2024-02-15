/*!
 * Copyright 2012 - 2024 Digital Bazaar, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

// eslint-disable-next-line max-len
const PROPERTY_REGEX = /[^.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|$))/g;
const ESCAPE_REGEX = /\\(\\)?/g;

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

// replacement for lodash.get
export function getByPath(target, path, defaultValue) {
  const parsed = toPath(path);
  const value = parsed.reduce((value, key) => {
    _assertNoProto(key);
    return value?.[key];
  }, target);
  return value !== undefined ? value : defaultValue;
}

// replacment for lodash.set
export function setByPath(target, path, value) {
  const parsed = toPath(path);
  const last = parsed.pop();
  for(const key of parsed) {
    _assertNoProto(key);
    target = target[key] = target[key] || {};
  }
  _assertNoProto(last);
  target[last] = value;
}

// replacement for lodash.topath
// see: https://raw.githubusercontent.com/lodash/lodash/master/LICENSE
export function toPath(unparsedPath) {
  if(Array.isArray(unparsedPath)) {
    return unparsedPath;
  }

  const path = [];
  unparsedPath.replace(PROPERTY_REGEX, function(match, number, quote, string) {
    path.push(quote ? string.replace(ESCAPE_REGEX, '$1') : (number || match));
  });
  return path;
}

function _assertNoProto(key) {
  if(key === '__proto__') {
    throw new Error('"__proto__" not allowed in path.');
  }
}
