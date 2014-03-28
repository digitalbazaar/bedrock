/*!
 * Key module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './key.controller',
  './keys.controller',
  './key.service',
  './keys.directive',
  './modalGenerateKeyPair.directive',
  './modalAddKey.directive',
  './modalEditKey.directive',
  './keySelector.directive',
], function(
  angular, keyCtrl, keysCtrl, keyService, keysDirective,
  modalGenerateKeyPair, modalAddKey, modalEditKey, keySelector) {

'use strict';

var module = angular.module('app.key', []);

module.controller(keyCtrl.controller);
module.controller(keysCtrl.controller);
module.service(keyService);
module.directive(keysDirective);
module.directive(modalGenerateKeyPair);
module.directive(modalAddKey);
module.directive(modalEditKey);
module.directive(keySelector);

module.config(['$routeProvider',
  function($routeProvider) {
    angular.forEach(keyCtrl.routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
    angular.forEach(keysCtrl.routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
  }
]);

});
