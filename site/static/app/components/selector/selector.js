/*!
 * Selector module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './selector-directive'
], function(angular, selectorDirective) {

'use strict';

var module = angular.module('app.selector', []);

module.directive(selectorDirective);

return module.name;

});
