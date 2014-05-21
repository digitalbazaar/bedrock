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
  .version('0.0.2')
  .usage('[options]')
  .option('-c, --config [config]',
    'Set config file to use. [./configs/test.js]',
    './configs/test.js')
  .option('-b, --backend', 'Perform all backend tests')
  .option('-f, --frontend', 'Perform all frontend tests')
  .option('-s, --suite [suite]', 'Run a specific frontend test suite')
  .option('-u, --browser [browser]',
    'Run frontend tests on a specific browser (chrome, firefox)')
  //.option('-d, --display', 'The X display to use for frontend tests')
  .parse(process.argv);

// TODO: allow selenium addr and port to be given instead to connect to a
// different selenium server
// browser-based system tests should connect to an X display
/*if(!process.env.DISPLAY) {
  process.env.DISPLAY = program.display ? program.display : ':0';
}*/

// check to see which tests to run
var tests = [];
if(program.backend) {
  tests.push('backend');
}
if(program.frontend) {
  tests.push('frontend');
}

if(tests.length < 1) {
  console.log('Error: You must specify the type of test to run.');
  program.help();
  process.exit(1);
}

process.env.NODE_ENV = 'test';
process.env.TEST_ENV = tests.join(',');

// load test config
require(program.config);

// set frontend test suite
if(program.suite) {
  br.config.test.frontend.suite = program.suite;
}
// set frontend browser
if(program.browser) {
  br.config.test.frontend.browser = program.browser;
}

// start
br.start();
