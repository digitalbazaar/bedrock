/*!
 * Identity Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$rootScope', 'ResourceService', 'config'];
return {IdentityService: deps.concat(factory)};

function factory($rootScope, ResourceService, config) {
  var service = {};

  var session = config.data.session || {auth: false};
  service.identity = session.identity || null;
  service.identityMap = session.identities || {};
  service.identities = [];
  angular.forEach(service.identityMap, function(identity) {
    service.identities.push(identity);
  });

  service.collection = new ResourceService.Collection({
    url: config.data.identityBaseUri
  });
  // FIXME: update other code so common collection can be used
  //service.identities = service.collection.storage;
  service.state = service.collection.state;

  // add a new identity
  service.add = function(identity, options) {
    return service.collection.add(identity, options)
      .then(function(newIdentity) {
        // FIXME: use newIdentity?
        service.identityMap[identity.id] = identity;
        service.identities.push(identity);
      });
  };

  // expose service to scope
  $rootScope.app.services.identity = service;

  return service;
}

});
