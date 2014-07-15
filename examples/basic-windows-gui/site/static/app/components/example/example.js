/*!
 * Example module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
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
