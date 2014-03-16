/*!
 * Navbar module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'navbar.controller'
], function(angular, controller) {

'use strict';

var module = angular.module('app.navbar', []);

module.controller(controller);

});
