/*
 * Bedrock-based Windows GUI Example
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 */
__libdir = require('path').resolve(__dirname, 'node_modules/bedrock/lib/');
var br = require(__libdir + '/bedrock');
// load example config
require('./configs/example');

if(module.parent) {
  module.exports = br;
} else {
  br.start();
}
