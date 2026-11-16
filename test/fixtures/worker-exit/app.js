/*!
 * Copyright 2026 Digital Bazaar, Inc.
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
// child app used by test/mocha/worker-exit.js; not loaded by the test suite
import * as bedrock from '@bedrock/core';

// `MODE` is `crash` (uncaught error in a worker) or `clean` (orderly exit)
const {MODE} = process.env;

bedrock.events.on('bedrock.ready', () => {
  // keep an open handle alive so the worker must be forced to exit
  setInterval(() => {}, 1000);
  if(MODE === 'clean') {
    setTimeout(() => bedrock.exit(), 50);
  } else {
    setTimeout(() => {
      throw new Error('simulated uncaught error');
    }, 50);
  }
});

bedrock.start();
