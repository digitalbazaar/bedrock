/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
// FIXME: Should this be a global variable?
__libdir = require('path').resolve(__dirname, 'lib');
var bedrock = require(__libdir + '/bedrock');

if(module.parent) {
  module.exports = bedrock;
}
else {
  // running in development mode
  // load dev config and start
  require('./configs/dev');
  bedrock.start();
}
