/*!
 * Directives module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'app/directives/animate',
  'app/directives/duplicateChecker',
  'app/directives/fadein',
  'app/directives/fadeout',
  'app/directives/fadeToggle',
  'app/directives/feedback',
  'app/directives/focusToggle',
  'app/directives/helpToggle',
  'app/directives/identitySelector',
  'app/directives/inputWatcher',
  'app/directives/modalAddIdentity',
  'app/directives/modalAlert',
  'app/directives/modalEditKey',
  'app/directives/modalSelector',
  'app/directives/mouseoverToggle',
  'app/directives/ngBlur',
  'app/directives/ngFocus',
  'app/directives/placeholder',
  'app/directives/popoverTemplate',
  'app/directives/selector',
  'app/directives/slugIn',
  'app/directives/slugOut',
  'app/directives/spinner',
  'app/directives/submitForm',
  'app/directives/tabs',
  'app/directives/tooltipTitle',
  'app/directives/trackState'
], function(angular) {
  angular.module('app.directives', []).directive(angular.extend.apply(
    null, [{}].concat(Array.prototype.slice.call(arguments, 1))));
});
