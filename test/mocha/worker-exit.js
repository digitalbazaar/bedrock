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
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {spawn} from 'node:child_process';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const APP = path.join(__dirname, '..', 'fixtures', 'worker-exit', 'app.js');

// runs the fixture app as a separate bedrock process and resolves with its
// exit code; rejects if it does not exit in time
function runApp({mode, timeout = 60000}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath, [...process.execArgv, APP, 'start'], {
        env: {...process.env, MODE: mode},
        stdio: 'ignore'
      });
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(`app did not exit within ${timeout}ms`));
    }, timeout);
    child.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('exit', code => {
      clearTimeout(timer);
      resolve(code);
    });
  });
}

describe('worker exit', function() {
  this.timeout(120000);
  it('exits 1 when a worker has an uncaught error', async function() {
    const code = await runApp({mode: 'crash'});
    code.should.equal(1);
  });
  it('exits 0 on an orderly shutdown', async function() {
    const code = await runApp({mode: 'clean'});
    code.should.equal(0);
  });
});
