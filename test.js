/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var path = require('path');
var bedrock = require('./lib/bedrock');

// skip normal argv parsing
bedrock.config.cli = bedrock.config.cli || {};
bedrock.config.cli.parseArgs = false;

function collect(val, memo) {
  memo.push(val);
  return memo;
}

var program = bedrock.program
  .usage('[options]')
  .option('-c, --config [config]',
    'Set config file to use. [./configs/test.js]', collect,
    ['./configs/test.js'])
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

// load configs
program.config.forEach(function(cfg) {
  require(path.resolve(__dirname, cfg));
});

if(typeof program.tests === 'string') {
  if(program.backend && !program.frontend) {
    bedrock.config.test.backend.tests = program.tests.split(/[ ,]+/);
  } else if(!program.backend && program.frontend) {
    bedrock.config.test.frontend.tests = program.tests;
  } else {
    console.log('Error: Specified tests have ambiguous type ' +
      '(use --backend-tests or --frontend-tests instead of --tests)');
    program.help();
    process.exit(1);
  }
}
if(typeof program.backendTests === 'string') {
  bedrock.config.test.backend.tests = program.backendTests.split(/[ ,]+/);
}
if(typeof program.frontendTests === 'string') {
  bedrock.config.test.frontend.tests = program.frontendTests;
}

// set reporter
if(program.reporter) {
  bedrock.config.test.reporter = program.reporter;
}
// set frontend test suite
if(program.suite) {
  bedrock.config.test.frontend.suite = program.suite;
}
// set frontend browser
if(program.browser) {
  bedrock.config.test.frontend.browser = program.browser;
}
// set hide window
if(program.hide) {
  bedrock.config.test.frontend.hideBrowser = true;
}

bedrock.start();
