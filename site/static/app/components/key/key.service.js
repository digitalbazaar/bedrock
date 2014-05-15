/*!
 * Key Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$rootScope', 'config', 'svcIdentity', 'svcResource'];
return {svcKey: deps.concat(factory)};

function factory($rootScope, config, svcIdentity, svcResource) {
  var service = {};

  service.collection = new svcResource.Collection({
    url: svcIdentity.identity.id + '/keys'
  });
  service.keys = service.collection.storage;
  service.unrevokedKeys = [];
  service.state = service.collection.state;

  service.collection.revoke = function(keyId, options) {
    return service.collection.update({
      '@context': config.data.contextUrl,
      id: keyId,
      revoked: ''
    }, options);
  };

  // expose service to scope
  $rootScope.app.services.key = service;

  return service;
}

});
