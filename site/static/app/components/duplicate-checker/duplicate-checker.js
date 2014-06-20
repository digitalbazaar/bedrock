/*!
 * Duplicate checker module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './duplicate-checker-directive'
], function(angular, directive) {

'use strict';

var module = angular.module('app.duplicateChecker', []);

module.directive(directive);

});
