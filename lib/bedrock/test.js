/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var Mocha = require('mocha');
var exec = require('child_process').exec;
var fs = require('fs');
var path = require('path');
var spawn = require('child_process').spawn;
var superagent = require('superagent');
var wd = require('wd');

// constants
var MODULE_NS = 'bedrock.test';

// module API
var api = {};
api.name = MODULE_NS;
module.exports = api;

// local module variables

//the selenium process
var selenium;

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
    // FIXME: Turn this off as soon as possible
    ignoreLeaks: true
  });

  // add unit test files
  if(process.env.TEST_ENV.indexOf('unit') > -1) {
    var utDir = path.join(__dirname, 'tests', 'unit');
    fs.readdirSync(utDir).sort().forEach(function(file) {
      if(path.extname(file) === '.js') {
        mocha.addFile(path.join(utDir, file));
      }
    });
  }

  // add system test files
  if(process.env.TEST_ENV.indexOf('system') > -1) {
    var itDir = path.join(__dirname, 'tests', 'system');
    fs.readdirSync(itDir).sort().forEach(function(file) {
      if(path.extname(file) === '.js') {
        mocha.addFile(path.join(itDir, file));
      }
    });
  }

  if(process.env.TEST_ENV === 'unit') {
    mocha.run(function(failures) {
      process.exit(failures);
    });
  } else if(process.env.TEST_ENV.indexOf('system') > -1) {
    mocha.run(function(failures) {
      // force-kill the tests if they don't exit properly
      setTimeout(function() {
        console.log('Warning: Chromedriver did not exit cleanly, killing it.');
        // kill all of the chromedriver intances
        var killall = exec('/usr/bin/killall chromedriver');

        // shutdown selenium
        if(selenium) {
          selenium.kill();
        }

        process.exit(failures);
      }, 5000);

      // mocha has finished running, close all testing browsers
      // FIXME: This isn't closing the browser cleanly in latest webdriver
      GLOBAL.browser.chain().quit().status(function() {
        // shutdown selenium
        if(selenium) {
          selenium.kill();
        }

        process.exit(failures);
      });
    });
  }
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
    console.log('TEST_ENV must contain either \'unit\', \'system\' or ' +
      'both separated by a comma.');
    process.exit(1);
  }

  if(process.env.TEST_ENV === 'unit') {
    setupMocha();
  } else if(process.env.TEST_ENV.indexOf('system') > -1) {
    var agent = superagent.agent();

    // check to see if the selenium and chromedriver binaries exist
    var seleniumJar = __dirname +
      '/../../temp/sv-selenium/selenium-server-standalone.jar';
    var chromeDriver = __dirname + '/../../temp/sv-selenium/chromedriver';

    // use the system chromedriver if it exists
    if(fs.existsSync('/usr/lib/chromium-browser/chromedriver')) {
      chromeDriver = '/usr/lib/chromium-browser/chromedriver';
    }
    //console.log("seleniumJar", seleniumJar);
    //console.log("chromedriver", chromeDriver);
    if(!fs.existsSync(seleniumJar) || !fs.existsSync(chromeDriver)) {
      console.log('Selenium binaries not found. Run \'make install-selenium\'');
      process.exit(1);
    }

    // check to make sure another Selenium process isn't running
    agent.get('http://localhost:4444/').end(function(err, status) {
      if(!err || status !== undefined) {
        console.log('Found existing Selenium server. ' +
          ' Cannot start system testing Selenium server.');
        process.exit(1);
      }

      // start the Selenium server
      selenium = spawn('/usr/bin/java', [
        '-jar', seleniumJar, '-Dwebdriver.chrome.driver=' + chromeDriver,
      ]);

      selenium.stdout.on('data', function(data) {
        //console.log('stdout: ' + data);

        if(/Started SocketListener on/.test(data)) {
          var browser = wd.remote();

          // configure the WebDriver
          browser.on('status', function(/*info*/){
            //console.log('\x1b[36m%s\x1b[0m', info);
          });

          browser.on('command', function(/*method, path, data*/){
            //console.log(' > \x1b[33m%s\x1b[0m: %s', method, path, data || '');
          });

          // instantiate a new test browser window
          browser.chain()
            .init({browserName: 'chrome'})
            .status(function(err/*, status*/) {
              if(err) {
                console.log('Failed to start chrome via Selenium server.');
                process.exit(1);
              }
              GLOBAL.browser = browser;
              setupMocha();
          });
        }
      });

      selenium.stderr.on('data', function(/*data*/) {
        //console.log('stderr: ' + data);
      });

      selenium.on('close', function(code) {
        console.log('Selenium process stopped with code ' + code);
        process.exit(1);
      });
    });
  }
}
