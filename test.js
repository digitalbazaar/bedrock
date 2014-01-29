/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var path = require('path');
__libdir = process.env.BEDROCK_COV ?
  path.resolve(__dirname, 'lib-cov') :
  path.resolve(__dirname, 'lib');
var br = require(__libdir + '/bedrock');
var program = require('commander');

program
  .version('0.0.1')
  .usage('[options]')
  .option('-u, --unit', 'Perform all unit tests')
  .option('-s, --system', 'Perform all system tests')
  .option('-d, --display', 'The X display to use for system tests')
  .parse(process.argv);

// browser-based system tests should connect to an X display
if(!process.env.DISPLAY) {
  process.env.DISPLAY = program.display ? program.display : ':0';
}

// check to see which test suites to run
var tests = [];
if(program.unit) {
  tests.push('unit');
}
if(program.system) {
  tests.push('system');
}

if(tests.length < 1) {
  console.log('Error: You must specify the type of test to run.');
  program.help();
  process.exit(1);
}

// notify superagent that it should ignore self-signed certs
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
process.env.NODE_ENV = 'test';
process.env.TEST_ENV = tests.join(',');

// load test config and start
require('./configs/test');
br.start();
