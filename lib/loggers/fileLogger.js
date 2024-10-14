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
import * as brUtil from '../util.js';
import * as formatters from './formatters.js';
import {config} from '../config.js';
import {promises as fs} from 'node:fs';
import {passwdUser} from 'passwd-user';
import path from 'node:path';
import winston from 'winston';

const cc = brUtil.config.main.computer();

// config filenames
// configured here instead of config.js due to util dependency issues
cc({
  'loggers.app.filename': () => path.join(config.paths.log, 'app.log'),
  'loggers.access.filename': () => path.join(config.paths.log, 'access.log'),
  'loggers.error.filename': () => path.join(config.paths.log, 'error.log')
});

export async function init({transports}) {
  transports.app = new winston.transports.File({
    ...config.loggers.app,
    format: formatters.fromConfig(config.loggers.app.bedrock),
  });
  transports.access = new winston.transports.File({
    ...config.loggers.access,
    format: formatters.fromConfig(config.loggers.access.bedrock),
  });
  transports.error = new winston.transports.File({
    ...config.loggers.error,
    format: formatters.fromConfig(config.loggers.error.bedrock),
  });

  // ensure all files are created and have ownership set to the
  // application process user
  const fileLoggers = Object.keys(config.loggers).filter(function(name) {
    const logger = config.loggers[name];
    return (_isObject(logger) && 'filename' in logger);
  }).map(function(name) {
    return config.loggers[name];
  });
  for(const fileLogger of fileLoggers) {
    const dirname = path.dirname(fileLogger.filename);
    // make directory and chown if requested
    await fs.mkdir(dirname, {recursive: true});
    if('bedrock' in fileLogger && fileLogger.bedrock.enableChownDir) {
      await _chown(dirname);
    }
    // check file can be opened
    const f = await fs.open(fileLogger.filename, 'a');
    await f.close();
    // always chown log file
    await _chown(fileLogger.filename);
  }

  // set unique names for file transports
  transports.app.name = 'app';
  transports.access.name = 'access';
  transports.error.name = 'error';
}

async function _chown(filename) {
  let uid = config.core.running.userId;
  if(!(uid && process.getgid)) {
    return;
  }

  if(typeof uid !== 'number') {
    if(process.platform === 'win32') {
      // on Windows, just get the current UID
      uid = process.getuid();
    } else {
      try {
        ({userIdentifier: uid} = await passwdUser(uid));
      } catch(e) {
        throw new brUtil.BedrockError(
          `Unable to convert user "${uid}" to a numeric user id. ` +
          'Try using a uid number instead.',
          'Error', {cause: e});
      }
    }
  }

  await fs.chown(filename, uid, process.getgid());
}

/**
 * Returns true if the given value is an Object.
 *
 * @param {*} value - The value to check.
 *
 * @returns {boolean} True if it is an Object, false if not.
 */
function _isObject(value) {
  return (Object.prototype.toString.call(value) === '[object Object]');
}
