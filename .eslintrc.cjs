/*!
 * Copyright (c) 2022-2024 Digital Bazaar, Inc.
 *
 * SPDX-License-Identifier: BSD-3-Clause
 */
module.exports = {
  root: true,
  parserOptions: {
    // this is required for dynamic import()
    ecmaVersion: 2020
  },
  env: {
    node: true
  },
  extends: ['digitalbazaar', 'digitalbazaar/jsdoc'],
  ignorePatterns: ['node_modules/']
};
