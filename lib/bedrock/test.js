/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */

require('colors');
var Mocha = require('mocha');
require('mocha-as-promised')();
var async = require('async');
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var wd = require('wd');

var config = require('../bedrock').config;

// setup chai / chai-as-promised /
chai.use(chaiAsPromised);
var should = chai.should();

// enables chai assertion chaining
chaiAsPromised.transferPromiseness = wd.transferPromiseness;

// set globals for tests to use
GLOBAL.chai = chai;
GLOBAL.should = should;

// constants
var MODULE_NS = 'bedrock.test';

// module API
var api = {};
api.name = MODULE_NS;
module.exports = api;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  setTimeout(runTests, 100);
  callback();
};

/**
 * Initializes the mocha test environment.
 */
function setupMocha() {
  var reporter = process.env.BEDROCK_COV ? 'html-cov' : 'spec';
  var mocha = new Mocha({
    reporter: reporter,
    timeout: 15000,
    ignoreLeaks: false
  });

  // add a file or directory
  function _add(_path) {
    if(fs.existsSync(_path)) {
      var stats = fs.statSync(_path);
      if(stats.isDirectory()) {
        fs.readdirSync(_path).sort().forEach(function(file) {
          if(path.extname(file) === '.js') {
            mocha.addFile(path.join(_path, file));
          }
        });
      } else {
        if(path.extname(_path) === '.js') {
          mocha.addFile(_path);
        }
      }
    }
  }

  // add backend test files
  var tests = config.test.backend.tests || [];
  tests.forEach(function(path) {
    _add(path);
  });

  return mocha;
}

/**
 * Runs all automated tests.
 */
function runTests() {
  if(!process.env.TEST_RUNNER) {
    // don't run the tests if the process isn't the test runner
    return;
  }

  if(!process.env.TEST_ENV) {
    console.log('TEST_ENV environment variable not set, exiting.');
    console.log('TEST_ENV must contain either \'backend\', \'frontend\' or ' +
      'both separated by a comma.');
    process.exit(1);
  }

  var runBackend = process.env.TEST_ENV.indexOf('backend') > -1;
  var runFrontend = process.env.TEST_ENV.indexOf('frontend') > -1;

  // run backend tests first, then frontend
  async.waterfall([
    function(callback) {
      if(runBackend) {
        return setupMocha().run(function(failures) {
          if(failures) {
            return process.exit(failures);
          }
          callback();
        });
      }
      callback();
    },
    function(callback) {
      if(runFrontend) {
        var configFile = path.resolve(config.test.frontend.configFile);
        console.log('Running frontend tests via Protractor...');
        console.log('Server: ' + config.server.baseUri);
        console.log('Config: ' + configFile);
        // run protractor
        var cmd = path.resolve(
          __dirname, '..', '..', 'node_modules', '.bin', 'protractor');
        var args = ['--baseUrl', config.server.baseUri];
        if(config.test.frontend.suite) {
          console.log('Suite: ' + config.test.frontend.suite);
          args.push('--suite');
          args.push(config.test.frontend.suite);
        }
        if(config.test.frontend.browser) {
          console.log('Browser: ' + config.test.frontend.browser);
          args.push('--browser');
          args.push(config.test.frontend.browser);
        }
        args.push(config.test.frontend.configFile);
        // print eol
        console.log();
        var protractor = spawn(cmd, args);
        protractor.stderr.pipe(process.stderr);
        protractor.stdout.pipe(process.stdout);
        protractor.on('error', function(err) {
          console.log('Error', err);
          process.exit(1);
        });
        return protractor.on('close', function(code) {
          if(code) {
            return process.exit(code);
          }
          console.log('All frontend tests passed.');
          callback();
        });
      }
      callback();
    }
  ], function() {
    process.exit(0);
  });
}
