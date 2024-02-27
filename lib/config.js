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
import {fileURLToPath} from 'node:url';
import path from 'node:path';

export const config = {};

// set `__dirname` constant
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// cli info
config.cli = {};
config.cli.command = null;

// core
config.core = {};

// 0 means use # of cpus
config.core.workers = 1;

// error options
config.core.errors = {};
// include a stack trace in errors
config.core.errors.showStack = true;

// group and user IDs:
// - set if not null if system supports system calls
// - IDs can be numeric or string names

// primary process while starting
config.core.starting = {};
// in production may want to use 'adm' group
config.core.starting.groupId = null;
config.core.starting.userId = null;

// primary and workers after starting
config.core.running = {};
config.core.running.groupId = null;
config.core.running.userId = null;

// primary process
config.core.primary = {};
config.core.primary.title = 'bedrock1d';

// worker processes
config.core.worker = {};
config.core.worker.restart = false;
config.core.worker.title = 'bedrock1d-worker';

// constants
config.constants = {};

// common paths
config.paths = {
  cache: path.join(__dirname, '..', '.cache'),
  log: path.join('/tmp/bedrock-dev')
};

config.ensureConfigOverride = {};
// enable this feature when configuration overrides must occur during startup
config.ensureConfigOverride.enable = false;
// an array of path strings (e.g. 'mongodb.host', 'session-mongodb.ttl')
config.ensureConfigOverride.fields = [
  // deployments MUST override cache and log paths
  'paths.cache',
  'paths.log'
];

/* logging options
 * formatter options:
 *  default, json, logstash or a custom formatter function
 */
config.loggers = {};

// set to false to disable all file based logging
config.loggers.enableFileTransport = true;

// transport for console logging
config.loggers.console = {};

config.loggers.console.level = 'debug';
config.loggers.console.silent = false;
// bedrock options
config.loggers.console.bedrock = {};
config.loggers.console.bedrock.formatter = 'default';
config.loggers.console.bedrock.colorize = true;
config.loggers.console.bedrock.onlyModules = false;
config.loggers.console.bedrock.excludeModules = false;

// file transport for app logging
config.loggers.app = {};
config.loggers.app.level = 'debug';
config.loggers.app.silent = false;
// note: configured in loggers.js as path.join(config.paths.log, 'app.log')
config.loggers.app.filename = null;
config.loggers.app.maxsize = 2 * 1024 * 1024;
config.loggers.app.maxFiles = 10;
config.loggers.app.tailable = true;
// bedrock options
config.loggers.app.bedrock = {};
config.loggers.app.bedrock.formatter = 'default';
config.loggers.app.bedrock.colorize = false;
// chown the logging dir to bedrock.config.core.running.userId
config.loggers.app.bedrock.enableChownDir = false;

// file transport for access logging
config.loggers.access = {};

config.loggers.access.level = 'debug';
config.loggers.access.silent = false;
// note: configured in loggers.js as path.join(config.paths.log, 'access.log')
config.loggers.access.filename = null;
config.loggers.access.maxsize = 2 * 1024 * 1024;
config.loggers.access.maxFiles = 10;
config.loggers.access.tailable = true;
// bedrock options
config.loggers.access.bedrock = {};
config.loggers.access.bedrock.formatter = 'default';
config.loggers.access.bedrock.colorize = false;
// chown the logging dir to bedrock.config.core.running.userId
config.loggers.access.bedrock.enableChownDir = false;

// file transport for error logging
config.loggers.error = {};
config.loggers.error.level = 'error';
config.loggers.error.silent = false;

// note: configured in loggers.js as path.join(config.paths.log, 'error.log')
config.loggers.error.filename = null;
config.loggers.error.maxsize = 2 * 1024 * 1024;
config.loggers.error.maxFiles = 10;
config.loggers.error.tailable = true;
// bedrock options
config.loggers.error.bedrock = {};
config.loggers.error.bedrock.formatter = 'default';
config.loggers.error.bedrock.colorize = false;
// chown the logging dir to bedrock.config.core.running.userId
config.loggers.error.bedrock.enableChownDir = false;

// categories-transports map
config.loggers.categories = {
  app: ['console', 'app', 'error'],
  access: ['access', 'error']
};
