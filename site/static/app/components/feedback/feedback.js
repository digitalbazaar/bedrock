/*!
 * Feedback module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './feedback-directive'
], function(angular, directive) {

'use strict';

var module = angular.module('app.feedback', []);

module.directive(directive);

return module.name;

});
