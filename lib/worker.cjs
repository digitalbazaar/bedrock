/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

// translate `worker.js` to CommonJS
require = require('esm')(module);
module.exports = require('./worker.js');
