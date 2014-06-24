/*!
 * Refresh Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$rootScope', 'ResourceService'];
return {RefreshService: deps.concat(factory)};

function factory($rootScope, ResourceService) {
  var service = {};

  /**
   * Registers a ResourceService.Collection or a new listener for refresh
   * events.
   *
   * @param [scope] the scope to register with (default: $rootScope).
   * @param fn the ResourceService.Collection to refresh or the function to
   *          call when a refresh event occurs.
   *
   * @return the registered ResourceService.Collection or function.
   */
  service.register = function(scope, fn) {
    if(typeof scope === 'function' ||
      scope instanceof ResourceService.Collection) {
      fn = scope;
      scope = $rootScope;
    }
    if(fn instanceof ResourceService.Collection) {
      // TODO: add a 'refreshIfAfter' datetime option to collection API
      var collection = fn;
      fn = function() {
        collection.getAll({force: true});
      };
    }

    if(typeof fn !== 'function') {
      throw new TypeError(
        'Registration parameter must be a ' +
        'ResourceService.Collection or a function.');
    }

    scope.$on('refreshData', fn);
    return fn;
  };

  /**
   * Sends a refresh event to all listeners.
   */
  service.refresh = function() {
    $rootScope.$broadcast('refreshData');
  };

  // expose service to scope
  $rootScope.app.services.refresh = service;

  return service;
}

});
