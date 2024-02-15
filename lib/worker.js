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

// wait for initialization options from primary
process.on('message', init);

process.send({type: 'bedrock.worker.online'}, err => {
  if(err) {
    console.log(err);
    process.exit(1);
  }
});

function init(msg) {
  if(!(typeof msg === 'object' && msg.type === 'bedrock.worker.init')) {
    return;
  }
  process.removeListener('message', init);

  // ensure current working directory is correct
  if(msg.cwd && process.cwd() !== msg.cwd) {
    process.chdir(msg.cwd);
  }

  // set bedrock global
  global.bedrock = {main: msg.main, worker: {filename: msg.script}};

  import(msg.script).catch(e => {
    throw e;
  });
}
