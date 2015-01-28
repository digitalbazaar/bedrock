/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('./config');
var events = require('./events');
var path = require('path');

// module API
var api = {};
module.exports = api;

// default config
config.mocha = {};
config.mocha.options = {
  reporter: 'spec',
  timeout: 15000,
  ignoreLeaks: false
};
config.mocha.tests = [];

// built-in tests
config.mocha.tests.push(path.join(__dirname, '..', 'tests'));

events.on('bedrock-cli.init', function() {
  var bedrock = require('./bedrock');
  bedrock.program
    .command('test')
    .description('run tests')
    .action(function() {
      config.cli.command = 'test';
    });
});

events.on('bedrock-cli.ready', function() {
  if(config.cli.command === 'test') {
    var bedrock = require('./bedrock');
    var logger = bedrock.loggers.get('app');
    var state = {pass: true};
    bedrock.runOnce('bedrock.test', function(callback) {
      logger.info('running tests...');
      bedrock.events.emit('bedrock.tests.run', state, function(err) {
        if(err) {
          logger.error('tests exited with error', err);
          return callback(err);
        }
        if(!state.pass) {
          logger.error('tests failed.');
        } else {
          logger.info('tests passed.');
        }
        callback();
      });
    }, function(err) {
      if(err) {
        process.exit(err.code || 0);
      }
      if(!state.pass) {
        process.exit(0);
      }
      bedrock.exit();
    });
    return false;
  }
});

events.on('bedrock.tests.run', runMocha);

/**
 * Run Mocha-based tests.
 *
 * @param test the global test state.
 */
function runMocha(state, callback) {
  require('colors');
  var bedrock = require('./bedrock');
  var Mocha = require('mocha');
  var chai = require('chai');
  var chaiAsPromised = require('chai-as-promised');
  var fs = require('fs');

  var logger = bedrock.loggers.get('app');

  // setup chai / chai-as-promised
  chai.use(chaiAsPromised);

  // set globals for tests to use
  GLOBAL.chai = chai;
  GLOBAL.should = chai.should();

  var mocha = new Mocha(config.mocha.options);

  // add backend test files
  config.mocha.tests.forEach(function(path) {
    _add(path);
  });

  state.mocha = {};
  mocha.run(function(failures) {
    if(failures) {
      state.mocha.failures = failures;
      state.pass = false;
    }
    callback();
  });

  // add a file or directory
  function _add(_path) {
    if(fs.existsSync(_path)) {
      var stats = fs.statSync(_path);
      if(stats.isDirectory()) {
        fs.readdirSync(_path).sort().forEach(function(file) {
          if(path.extname(file) === '.js') {
            file = path.join(_path, file);
            logger.debug('adding test file', file);
            mocha.addFile(file);
          }
        });
      } else {
        if(path.extname(_path) === '.js') {
          logger.debug('adding test file', _path);
          mocha.addFile(_path);
        }
      }
    }
  }

  return mocha;
}
