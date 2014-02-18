/*!
 * Key Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['config', 'svcIdentity', 'svcResource'];
return {svcKey: deps.concat(factory)};

function factory(config, svcIdentity, svcResource) {
  var service = {};

  service.collection = new svcResource.Collection({
    url: svcIdentity.identity.id + '/keys'
  });
  service.keys = service.collection.storage;
  service.state = service.collection.state;

  service.collection.revoke = function(keyId, options) {
    return service.collection.update({
      '@context': config.data.contextUrl,
      id: keyId,
      revoked: ''
    }, options);
  };

  return service;
}

});
