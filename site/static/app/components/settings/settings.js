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
  './keySettings.controller',
  './settings.controller'
], function(angular, identitySettings, keySettings, settings) {

'use strict';

var module = angular.module('app.settings', []);

module.controller(identitySettings);
module.controller(keySettings);
module.controller(settings.controller);

module.config(['$routeProvider',
  function($routeProvider) {
    angular.forEach(settings.routes, function(route) {
      $routeProvider.when(route.path, route.options);
    });
  }
]);

});
