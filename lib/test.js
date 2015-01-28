/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('./config');
var events = require('./events');

// module API
var api = {};
module.exports = api;

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
    bedrock.runOnce('bedrock.test', function(callback) {
      logger.info('running tests...');
      bedrock.events.emit('bedrock.tests.run', function(err) {
        if(err) {
          logger.error('tests completed with error', err);
        } else {
          logger.info('tests complete.');
        }
        callback();
      });
    }, function(err) {
      if(err) {
        process.exit(err.code || 0);
      }
      bedrock.exit();
    });
    return false;
  }
});
