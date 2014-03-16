/*!
 * Dashboard module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'dashboard.controller'
], function(angular, controller) {

'use strict';

var module = angular.module('app.dashboard', []);

module.controller(controller.controller);

module.config(['$routeProvider',
  function($routeProvider) {
    angular.forEach(controller.routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
  }
]);

});
