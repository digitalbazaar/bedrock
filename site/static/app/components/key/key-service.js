/*!
 * Key Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(
  $rootScope, brIdentityService, brModelService, brRefreshService,
  brResourceService, config) {
  var service = {};

  var cache = {};

  /**
   * Create a keys service for an identity.
   *
   * @param options
   *          identityId: the identity id
   *          url: the keys URL
   */
  function Service(options) {
    this.identityId = options.identityId;
    this.url = options.url;
    this.collection = new brResourceService.Collection({
      url: this.url,
      finishLoading: this._update
    });
    this.keys = this.collection.storage;
    this.unrevokedKeys = [];
    this.state = this.collection.state;
  };

  service.get = function(options) {
    var identityId = brIdentityService.generateUrl(options);
    var url = identityId + '/keys';
    if(!(url in cache)) {
      var newService = new Service({
        identityId: identityId,
        url: url
      });
      cache[url] = newService;

      // register for system-wide refreshes
      brRefreshService.register(newService.collection);
    }
    return cache[url];
  };

  Service.prototype.update = function() {
    var unrevoked = value.filter(function(key) {return !key.revoked;});
    brModelService.replaceArray(this.unrevokedKeys, unrevoked);
  }

  Service.prototype.revoke = function(keyId, options) {
    return this.collection.update({
      '@context': config.data.contextUrl,
      id: keyId,
      revoked: ''
    }, options);
  };

  // expose service to scope
  $rootScope.app.services.key = service;

  return service;
}

return {brKeyService: factory};

});
