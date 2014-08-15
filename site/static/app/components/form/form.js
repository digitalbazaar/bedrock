/*!
 * Form module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './input-directive',
  './select-directive',
  './textarea-directive',
], function(
  angular,
  inputDirective,
  selectDirective,
  textareaDirective) {

'use strict';

var module = angular.module('app.form', []);

module.directive(inputDirective);
module.directive(selectDirective);
module.directive(textareaDirective);

return module.name;

});
