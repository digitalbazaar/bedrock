/*!
 * Identity module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './create-identity-controller',
  './identity-controller',
  './identity-routes',
  './identity-service',
  './identity-credentials-controller',
  './identity-selector-directive',
  './identity-settings-controller',
  './add-identity-modal-directive',
  './credential-verify-service'
], function(
  angular, createIdentity, controller, routes, service, identityCredentials,
  identitySelector, identitySettingsController, modalAddIdentity,
  credentialVerifyService) {

'use strict';

var module = angular.module('app.identity', []);

module.controller(createIdentity);
module.controller(controller);
module.controller(identityCredentials.controller);
module.controller(identitySettingsController);
module.service(service);
module.service(credentialVerifyService);
module.directive(identitySelector);
module.directive(modalAddIdentity);

module.config(['$routeProvider',
  function($routeProvider) {
    angular.forEach(routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
  }
]);

});
