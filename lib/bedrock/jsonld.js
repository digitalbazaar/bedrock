/*
 * Copyright (c) 2013-2014 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('../config');
var constants = require('../config').constants;
var jsonld = require('jsonld')(); // use localized jsonld API

// require https for @contexts
var options = {secure: true};
// disable strict SSL during development
if(config.environment === 'development' || config.environment === 'testing') {
  options.strictSSL = false;
}
var nodeDocumentLoader = jsonld.documentLoaders.node(options);

jsonld.documentLoader = function(url, callback) {
  if(url in constants.CONTEXTS) {
    return callback(
      null, {
        contextUrl: null,
        document: constants.CONTEXTS[url],
        documentUrl: url
      });
  }
  nodeDocumentLoader(url, callback);
};

module.exports = jsonld;
