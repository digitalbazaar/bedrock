/*
 * Copyright (c) 2013-2015 Digital Bazaar, Inc. All rights reserved.
 */
var config = require('./config');
var constants = config.constants;
var events = require('./events');
var jsonld = require('jsonld')(); // use localized jsonld API

events.on('bedrock.init', function() {
  // require https for @contexts
  var options = {secure: true};

  // set strictSSL option if configured
  if('strictSSL' in config.jsonld) {
    options.strictSSL = config.jsonld.strictSSL;
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
});

// setup initial temporary document loader to log warning if it's used before
// jsonld is configured
var defaultDocumentLoader = jsonld.documentLoader;
jsonld.documentLoader = function(url, callback) {
  // FIXME: improve warning logging method (if even needed?)
  // Could possibly be run too early to easily use bedrock logging system.
  console.warn(
    'WARNING: JSON-LD document loader used before JSON-LD initialized.');
  defaultDocumentLoader(url, callback);
};

module.exports = jsonld;
