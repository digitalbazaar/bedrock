/*!
 * Credential Verification Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['./credentialVerifier'], function(verifier) {

'use strict';

var deps = ['$rootScope'];
return {svcCredentialVerify: deps.concat(factory)};

function factory($rootScope) {
  var service = {};
  service.verifier = verifier;

  // expose service to scope
  $rootScope.app.services.credentialVerify = service;

  return service;
}

});
