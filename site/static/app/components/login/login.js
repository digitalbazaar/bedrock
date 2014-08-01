/*!
 * Login module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './login-controller',
  './login-modal-directive',
  './login-routes'
], function(
  angular,
  loginController,
  loginModalDirective,
  loginRoutes
) {

'use strict';

var module = angular.module('app.login', []);

module.controller(loginController);
module.directive(loginModalDirective);

/* @ngInject */
module.config(function($routeProvider) {
  angular.forEach(loginRoutes, function(route) {
    $routeProvider.when(route.path, route.options);
  });
});

return module.name;

});
