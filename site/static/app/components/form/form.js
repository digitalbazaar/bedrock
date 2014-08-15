/*!
 * Form module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './help-toggle-directive',
  './input-directive',
  './input-watcher-directive',
  './select-directive',
  './submit-form-directive',
  './textarea-directive',
  './track-state-directive'
], function(
  angular,
  helpToggleDirective,
  inputDirective,
  inputWatcherDirective,
  selectDirective,
  submitFormDirective,
  textareaDirective,
  trackStateDirective) {

'use strict';

var module = angular.module('app.form', []);

module.directive(helpToggleDirective);
module.directive(inputDirective);
module.directive(inputWatcherDirective);
module.directive(selectDirective);
module.directive(submitFormDirective);
module.directive(textareaDirective);
module.directive(trackStateDirective);

return module.name;

});
