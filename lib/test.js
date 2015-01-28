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

events.on('bedrock-cli.init', function(callback) {
  var bedrock = require('./bedrock');

  // add test command
  var command = bedrock.program
    .command('test')
    .description('run tests')
    .action(function() {
      command.name = 'test';
      config.cli.command = command;
      // only log critical errors to the console
      bedrock.config.loggers.console.level = 'critical';
    });

  // allow special test configs to load
  events.emit('bedrock-cli.test.configure', command, callback);
});

events.on('bedrock-cli.ready', function(callback) {
  if(config.cli.command.name !== 'test') {
    return callback();
  }
  events.emit('bedrock.test.configure', callback);
});

events.on('bedrock.started', function() {
  if(config.cli.command.name === 'test') {
    var bedrock = require('./bedrock');
    var logger = bedrock.loggers.get('app');
    var state = {pass: true};
    bedrock.runOnce('bedrock.test', function(callback) {
      console.log('Running Test Frameworks...\n');
      logger.info('running test frameworks...');
      bedrock.events.emit('bedrock.tests.run', state, function(err) {
        if(err) {
          console.log('Tests exited with error', err);
          logger.error('tests exited with error', err);
          return callback(err);
        }
        if(!state.pass) {
          console.log('Tests failed.');
          logger.error('tests failed.');
        } else {
          console.log('All tests passed.');
          logger.info('all tests passed.');
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

events.on('bedrock-cli.test.configure', function(command) {
  command
    .option(
      '--mocha-test <files>',
      'A set of comma-delimited mocha test files to run.');
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

  // add test files
  if(config.cli.command.mochaTest) {
    config.cli.command.mochaTest.split(',').forEach(function(path) {
      _add(path);
    });
  } else {
    config.mocha.tests.forEach(function(path) {
      _add(path);
    });
  }

  // console.log w/o eol
  process.stdout.write('Running Mocha tests...');

  state.mocha = {};
  mocha.run(function(failures) {
    if(failures) {
      state.mocha.failures = failures;
      state.pass = false;
    }
    // TODO: need a better way to control skipping particular frameworks --
    // or all of them except *this* one whatever *this* may be
    callback(null, !config.cli.command.mochaTest);
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
