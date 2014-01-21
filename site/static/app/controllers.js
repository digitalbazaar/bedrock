/*!
 * Controllers module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'app/controllers/createProfile',
  'app/controllers/dashboard',
  'app/controllers/key',
  'app/controllers/keySettings',
  'app/controllers/login',
  'app/controllers/navbar',
  'app/controllers/passcode',
  'app/controllers/settings'
], function(angular) {
  // register controllers and gather routes
  var module = angular.module('app.controllers', []);
  var controllers = Array.prototype.slice.call(arguments, 1);
  var routes = [];
  angular.forEach(controllers, function(controller) {
    if('controller' in controller || 'routes' in controller) {
      module.controller(controller.controller || {});
      routes.push.apply(routes, controller.routes || []);
    }
    else {
      module.controller(controller);
    }
  });

  // register routes
  module.config(['$locationProvider', '$routeProvider',
    function($locationProvider, $routeProvider) {
      $locationProvider.html5Mode(true);
      $locationProvider.hashPrefix('!');
      angular.forEach(routes, function(route) {
        $routeProvider.when(route.path, route.options);
      });

      // non-route
      $routeProvider.otherwise({none: true});
    }
  ]);
});
