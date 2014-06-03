/*!
 * Credential Verification Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'forge/md', 'forge/pki', 'forge/util', 'jsonld', 'underscore',
  './credentialVerifier'],
function(md, pki, util, jsonld, _, verifierFactory) {

'use strict';

var deps = ['config', '$rootScope'];
return {svcCredentialVerify: deps.concat(factory)};

function factory(config, $rootScope) {
  var service = {};

  /**
   * Creates a new credential verifier API.
   *
   * @param options the options to use:
   *          [documentLoader] a custom JSON-LD document loader to use.
   *          [disableLocalFraming] true to disable framing of local
   *            documents (default: true).
   *
   * @return the credential verifier API.
   */
  service.createVerifier = function(options) {
    return createVerifier(config, options);
  };

  // expose service to scope
  $rootScope.app.services.credentialVerify = service;

  return service;
}

function createVerifier(config, options) {
  // prepare forge
  var forge = {md: md(), pki: pki(), util: util()};

  // configure local copy of jsonld
  jsonld = jsonld();
  if(options.documentLoader) {
    jsonld.documentLoader = options.documentLoader;
  } else {
    // use secure document loader
    jsonld.useDocumentLoader('xhr', {secure: true});
  }

  if(options.disableLocalFraming) {
    // override jsonld framing for local documents
    var _promises = jsonld.promises;
    jsonld.promises = function() {
      var api = _promises();
      var _frame = api.frame;
      api.frame = function(input, frame, options) {
        // skip framing if data is local, already framed properly
        if((typeof input === 'string' &&
          input.indexOf(config.data.baseUri) === 0)) {
          return jsonld.documentLoader(input).then(function(response) {
            if(typeof response.document === 'string') {
              response.document = JSON.parse(response.document);
            }
            return {
              '@context': response.document['@context'],
              '@graph': [response.document]
            };
          });
        }
        if('id' in input && input.id.indexOf(config.data.baseUri) === 0) {
          return Promise.resolve({
            '@context': input['@context'],
            '@graph': [input]
          });
        }
        // input is non-local, do regular framing
        return _frame(input, frame, options);
      };
      return api;
    };
  }

  return verifierFactory({
    forge: forge,
    jsonld: jsonld,
    Promise: Promise,
    _: _
  });
}

});
