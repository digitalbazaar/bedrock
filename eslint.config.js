/*!
 * Copyright 2022-2024 Digital Bazaar, Inc.
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
import globals from 'globals';

import digitalbazaar from 'eslint-config-digitalbazaar';
import digitalbazaarJsdoc from 'eslint-config-digitalbazaar/jsdoc';
import digitalbazaarModule from 'eslint-config-digitalbazaar/module';

export default [
  {
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  ...digitalbazaar,
  ...digitalbazaarJsdoc,
  ...digitalbazaarModule,
  {
    rules: {
      'unicorn/prefer-node-protocol': 'error'
    }
  },
  {
    files: [
      'test/mocha/**/*.js'
    ],
    languageOptions: {
      globals: {
        ...globals.mocha,
        should: true
      }
    }
  }
];
