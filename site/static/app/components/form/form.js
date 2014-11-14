/*!
 * Form module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './datepicker-directive',
  './form-directive',
  './form-field-directive',
  './form-group-directive',
  './form-library-service',
  './help-toggle-directive',
  './input-directive',
  './input-watcher-directive',
  './radio-group-directive',
  './select-directive',
  './textarea-directive',
  './track-state-directive'
], function(
  angular,
  datepickerDirective,
  formDirective,
  formFieldDirective,
  formGroupDirective,
  formLibraryService,
  helpToggleDirective,
  inputDirective,
  inputWatcherDirective,
  radioGroupDirective,
  selectDirective,
  textareaDirective,
  trackStateDirective) {

'use strict';

var module = angular.module('app.form', []);

module.directive(datepickerDirective);
module.directive(formDirective);
module.directive(formFieldDirective);
module.directive(formGroupDirective);
module.service(formLibraryService);
module.directive(helpToggleDirective);
module.directive(inputDirective);
module.directive(inputWatcherDirective);
module.directive(radioGroupDirective);
module.directive(selectDirective);
module.directive(textareaDirective);
module.directive(trackStateDirective);

return module.name;

});
