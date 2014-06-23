/*!
 * Key Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = [
  '$rootScope', 'IdentityService', 'ModelService', 'ResourceService', 'config'];
return {KeyService: deps.concat(factory)};

function factory(
  $rootScope, IdentityService, ModelService, ResourceService, config) {
  var service = {};

  service.collection = new ResourceService.Collection({
    url: IdentityService.identity.id + '/keys'
  });
  service.keys = service.collection.storage;
  service.unrevokedKeys = [];
  service.state = service.collection.state;

  // TODO: could be more efficiently implemented as an observer pattern
  // that can be accessed via ResourceService.collection creation API
  // maybe angular 2.0 will fix
  $rootScope.$watch(function() {return service.keys;}, function(value) {
    if(!value) {
      return;
    }
    var unrevoked = value.filter(function(key) {return !key.revoked;});
    ModelService.replaceArray(service.unrevokedKeys, unrevoked);
  }, true);

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
