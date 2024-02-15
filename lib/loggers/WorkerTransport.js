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

import cycle from 'cycle';
import Transport from 'winston-transport';

export class WorkerTransport extends Transport {
  constructor(config) {
    super(config);
    this.category = config.category;
    this.name = 'worker';
    this.workerId = config.workerId;
  }

  log(info, callback) {
    for(const key in info) {
      const value = info[key];
      // convert errors into objects
      if(value instanceof Error) {
        info[key] = {
          message: value.message,
          stack: value.stack,
          ...cycle.decycle(value)
        };
      } else {
        // decycle all other values
        info[key] = cycle.decycle(value);
      }
    }
    info.workerId = this.workerId;
    info.workerPid = process.pid;

    // send logger message to primary and ignore EPIPE errors that prevent the
    // message from reaching the primary because it has disconnected
    process.send({
      type: 'bedrock.logger',
      info,
      category: this.category
    }, _noop);

    callback();
  }
}

function _noop() {
}
