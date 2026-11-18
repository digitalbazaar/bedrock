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
// exit code and captured stdout/stderr; rejects if it does not exit in time
function runApp({mode, timeout = 60000}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath, [...process.execArgv, APP, 'start'], {
        env: {...process.env, MODE: mode},
        stdio: ['ignore', 'pipe', 'pipe']
      });
    let output = '';
    const capture = data => {
      output += data.toString();
    };
    child.stdout.on('data', capture);
    child.stderr.on('data', capture);
    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      reject(new Error(
        `app did not exit within ${timeout}ms; output:\n${output}`));
    }, timeout);
    child.on('error', err => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('exit', code => {
      clearTimeout(timer);
      resolve({code, output});
    });
  });
}

// asserts the app's exit code, including the child's output on failure so
// CI logs show why the process exited the way it did
function expectExitCode(result, expected) {
  if(result.code !== expected) {
    throw new Error(
      `expected exit code ${expected}, got ${result.code}; output:\n` +
      result.output);
  }
}

describe('worker exit', function() {
  this.timeout(120000);
  it('exits 1 when a worker has an uncaught error', async function() {
    const result = await runApp({mode: 'crash'});
    expectExitCode(result, 1);
  });
  it('exits 0 on an orderly shutdown', async function() {
    const result = await runApp({mode: 'clean'});
    expectExitCode(result, 0);
  });
});
