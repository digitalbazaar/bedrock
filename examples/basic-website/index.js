/*
 * Bedrock-based Windows GUI Example
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 */
var br = require('bedrock');
// load example config
require('./configs/example');

if(module.parent) {
  module.exports = br;
} else {
  br.start();
}
