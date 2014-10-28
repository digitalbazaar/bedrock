/*!
 * Key module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './add-key-modal-directive',
  './edit-key-modal-directive',
  './generate-key-pair-modal-directive',
  './key-controller',
  './key-routes',
  './key-selector-directive',
  './key-service',
  './keys-controller',
  './keys-directive'
], function(
  angular,
  addKeyModalDirective,
  editKeyModalDirective,
  generateKeyPairModalDirective,
  keyController,
  keyRoutes,
  keySelectorDirective,
  keyService,
  keysController,
  keysDirective
) {

'use strict';

var module = angular.module('app.key', []);

module.directive(addKeyModalDirective);
module.directive(editKeyModalDirective);
module.directive(generateKeyPairModalDirective);
module.controller(keyController);
module.directive(keySelectorDirective);
module.service(keyService);
module.controller(keysController);
module.directive(keysDirective);

/* @ngInject */
module.config(function($routeProvider) {
  angular.forEach(keyRoutes, function(route) {
    $routeProvider.when(route.path, route.options);
  });
});

return module.name;

});
