/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const config = require('./config');
const events = require('./events');
const path = require('path');
const BedrockError = require('./util').BedrockError;

// module API
const api = {};
module.exports = api;

// add mocha as available test framework
config.test.frameworks.push('mocha');

// default mocha config
config.mocha = {};
config.mocha.options = {
  ignoreLeaks: false,
  reporter: 'spec',
  timeout: 15000,
  useColors: true
};
config.mocha.tests = [];

// built-in tests
config.mocha.tests.push(path.join(__dirname, '..', 'tests'));

events.on('bedrock-cli.init', function(callback) {
  const bedrock = require('./bedrock');

  // add test command
  const command = bedrock.program
    .command('test')
    .description('run tests')
    .option(
      '--framework <frameworks>',
      'A set of comma-delimited test frameworks to run. [all] ' +
      '(' + config.test.frameworks.join(', ') + ')')
    .action(function() {
      config.cli.command = command;
      // load config for testing
      require('./test.config.js');
    });

  // allow special test configs to load
  events.emit('bedrock-cli.test.configure', command, callback);
});

events.on('bedrock-cli.ready', function(callback) {
  const command = config.cli.command;
  if(command.name() !== 'test') {
    return callback();
  }

  // set reporter
  if(command.mochaReporter) {
    config.mocha.options.reporter = command.mochaReporter;
  }

  events.emit('bedrock.test.configure', callback);
});

events.on('bedrock.started', function() {
  if(config.cli.command.name() === 'test') {
    const bedrock = require('./bedrock');
    const logger = bedrock.loggers.get('app');
    const state = {pass: true};
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
      'A set of comma-delimited mocha test files to run.')
    .option('--mocha-reporter <reporter>',
      'Mocha test reporter [spec]', 'spec');
});

events.on('bedrock.tests.run', function(state, callback) {
  if(api.shouldRunFramework('mocha')) {
    return runMocha(state, callback);
  }
  callback();
});

/**
 * Check if a test framework is runnable.
 *
 * @param test the global test state.
 */
api.shouldRunFramework = function(framework) {
  const frameworks = config.cli.command.framework;
  // default to run, else check for name in frameworks list
  return !frameworks || frameworks.split(/[ ,]+/).indexOf(framework) !== -1;
};

/**
 * Run Mocha-based tests.
 *
 * @param test the global test state.
 */
function runMocha(state, callback) {
  const bedrock = require('./bedrock');
  const Mocha = require('mocha');
  const chai = require('chai');
  const chaiAsPromised = require('chai-as-promised');
  const fs = require('fs');

  const logger = bedrock.loggers.get('app');

  // setup chai / chai-as-promised
  chai.use(chaiAsPromised);

  // set globals for tests to use
  global.chai = chai;
  global.should = chai.should();

  global.assertNoError = err => {
    if(err) {
      const obj = err instanceof BedrockError ? err.toObject() : err;
      console.error(
        'An unexpected error occurred:', JSON.stringify(obj, null, 2));
      throw err;
    }
  };

  const mocha = new Mocha(config.mocha.options);

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
    callback();
  });

  // add a file or directory
  function _add(_path) {
    if(fs.existsSync(_path)) {
      const stats = fs.statSync(_path);
      if(stats.isDirectory()) {
        fs.readdirSync(_path).sort().forEach(function(file) {
          if(path.extname(file) === '.js') {
            file = path.join(_path, file);
            logger.debug('adding test file', file);
            mocha.addFile(file);
          }
        });
      } else if(path.extname(_path) === '.js') {
        logger.debug('adding test file', _path);
        mocha.addFile(_path);
      }
    }
  }
}
