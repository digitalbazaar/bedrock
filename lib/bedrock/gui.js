/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var TopCube = require('topcube');

var api = {};
module.exports = api;
api.name = 'gui';

api.init = function(app, callback) {
  callback();

  setTimeout(function() {
    // FIXME: Event should be fired when system has finished module init
    TopCube({
      url: bedrock.config.server.baseUri,
      name: bedrock.config.brand.name,
      width: 1024,
      height: 768
    });
  }, 3000);
};
