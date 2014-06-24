/*!
 * Refresh Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$rootScope'];
return {RefreshService: deps.concat(factory)};

function factory($rootScope) {
  var service = {};

  /**
   * Registers a new listener for refresh events.
   *
   * @param [scope] the scope to register with (default: $rootScope).
   * @param fn the function to call when a refresh event occurs.
   * @param [call] true to call the refresh function after registration.
   */
  service.register = function(scope, fn, call) {
    if(typeof scope === 'function') {
      if(typeof fn === 'boolean') {
        call = fn;
      }
      fn = scope;
      scope = $rootScope;
    }
    scope.$on('refreshData', fn);
    if(call) {
      fn();
    }
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
