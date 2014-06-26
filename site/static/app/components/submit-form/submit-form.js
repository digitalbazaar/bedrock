/*!
 * Submit Form module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './submit-form-directive'
], function(angular, directive) {

'use strict';

var module = angular.module('app.submitForm', []);

module.directive(directive);

return module.name;

});
