/*!
 * Dashboard module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './dashboard-controller',
  './dashboard-routes'
], function(angular, controller, routes) {

'use strict';

var module = angular.module('app.dashboard', []);

module.controller(controller);

/* @ngInject */
module.config(function($routeProvider) {
  angular.forEach(routes, function(route) {
    $routeProvider.when(route.path, route.options);
  });
});

return module.name;

});
