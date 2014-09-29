/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var path = require('path');
var br = require('./lib/bedrock');
var program = require('commander');

program
  .version('0.0.2')
  .usage('[options]')
  .option('-c, --config [config]',
    'Set config file to use. [./configs/test.js]',
    './configs/test.js')
  .option('-R, --reporter [reporter]', 'Mocha test reporter', 'spec')
  .option('-b, --backend', 'Perform backend tests')
  .option('-f, --frontend', 'Perform frontend tests')
  .option('-s, --suite [suite]', 'Run a specific frontend test suite')
  .option('-u, --browser [browser]',
    'Run frontend tests on a specific browser (chrome, firefox)')
  .option('-h, --hide', 'Hide the browser window during tests')
  .option('-t, --tests [tests]',
    'Run specific tests from a comma-separated list')
  .option('-bt, --backend-tests [tests]',
    'Run specific backend tests from a comma-separated list')
  .option('-ft, --frontend-tests [tests]',
    'Run specific frontend tests from a comma-separated list')
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
if(program.backend || program.backendTests) {
  tests.push('backend');
}
if(program.frontend || program.frontendTests) {
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
var configFile = path.resolve(__dirname, program.config);
require(configFile);

if(typeof program.tests === 'string') {
  if(program.backend && !program.frontend) {
    br.config.test.backend.tests = program.tests.split(/[ ,]+/);
  } else if(!program.backend && program.frontend) {
    br.config.test.frontend.tests = program.tests;
  } else {
    console.log('Error: Specified tests have ambiguous type ' +
      '(use --backend-tests or --frontend-tests instead of --tests)');
    program.help();
    process.exit(1);
  }
}
if(typeof program.backendTests === 'string') {
  br.config.test.backend.tests = program.backendTests.split(/[ ,]+/);
}
if(typeof program.frontendTests === 'string') {
  br.config.test.frontend.tests = program.frontendTests;
}

// set reporter
if(program.reporter) {
  br.config.test.reporter = program.reporter;
}
// set frontend test suite
if(program.suite) {
  br.config.test.frontend.suite = program.suite;
}
// set frontend browser
if(program.browser) {
  br.config.test.frontend.browser = program.browser;
}
// set hide window
if(program.hide) {
  br.config.test.frontend.hideBrowser = true;
}

// start
br.start();
