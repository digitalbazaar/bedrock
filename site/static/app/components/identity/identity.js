/*!
 * Identity module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './createIdentity.controller',
  './identityCredentials.controller',
  './identity.service',
  './identitySelector.directive',
  './modalAddIdentity.directive'
], function(
  angular, createIdentity, identityCredentials,
  service, identitySelector, modalAddIdentity) {

'use strict';

var module = angular.module('app.identity', []);

module.controller(createIdentity);
module.controller(identityCredentials.controller);
module.service(service);
module.directive(identitySelector);
module.directive(modalAddIdentity);

module.config(['$routeProvider',
  function($routeProvider) {
    angular.forEach(identityCredentials.routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
  }
]);

});
