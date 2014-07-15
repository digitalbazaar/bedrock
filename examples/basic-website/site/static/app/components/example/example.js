/*!
 * Example component module.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([
  'angular',
  './example-controller'
], function(angular, exampleController) {

'use strict';

var module = angular.module('app.example', []);

module.controller(exampleController);

return module;

});
