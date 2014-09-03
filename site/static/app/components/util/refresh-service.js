/*!
 * Refresh Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($rootScope, brResourceService) {
  var service = {};

  /**
   * Registers a brResourceService.Collection or a new listener for refresh
   * events.
   *
   * @param [scope] the scope to register with (default: $rootScope).
   * @param fn the brResourceService.Collection to refresh or the function to
   *          call when a refresh event occurs.
   *
   * @return the registered function that can be called independently.
   */
  service.register = function(scope, fn) {
    if(typeof scope === 'function' ||
      scope instanceof brResourceService.Collection) {
      fn = scope;
      scope = $rootScope;
    }
    if(fn instanceof brResourceService.Collection) {
      // TODO: add a 'refreshIfAfter' datetime option to collection API
      var collection = fn;
      fn = function() {
        collection.getAll({force: true});
      };
    }

    if(typeof fn !== 'function') {
      throw new TypeError(
        'Registration parameter must be a ' +
        'brResourceService.Collection or a function.');
    }

    scope.$on('refreshData', fn);
    return fn;
  };

  // TODO: in order to implement unregister, fns would have to be stored
  // in a separate container and called from a single handler as $scope.$on
  // has no remove (then $scope.$on('$destroy') would also have to be
  // attached to remove listeners)

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

return {brRefreshService: factory};

});
