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

import {EventEmitter} from '@digitalbazaar/async-node-events';

const emitter = new EventEmitter();
emitter.setMaxListeners(Infinity);
emitter.removeAllListeners('maxListenersPassed');
export {emitter};

/**
 * Schedules an event to be emitted on the next tick (via process.nextTick).
 *
 * @param {Array} args - The arguments to emit.
 *
 * @returns {Promise} A Promise that resolves to undefined once the event has
 *   been emitted to all listeners (or to `false` if it was canceled).
 */
emitter.emitLater = function(...args) {
  // emit asynchronously
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      emitter.emit(...args).then(resolve, reject);
    });
  });
};
