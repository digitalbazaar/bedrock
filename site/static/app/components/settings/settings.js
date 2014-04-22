/*!
 * Settings module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './identitySettings.controller',
  './settings.controller',
  './settings.routes'
], function(angular, identitySettings, settings, routes) {

'use strict';

var module = angular.module('app.settings', []);

module.controller(settings);
module.controller(identitySettings);

module.config(['$routeProvider',
  function($routeProvider) {
    angular.forEach(routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
  }
]);

});
