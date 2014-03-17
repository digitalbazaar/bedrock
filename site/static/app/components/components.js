/*!
 * Components module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './dashboard/dashboard',
  './duplicateChecker/duplicateChecker',
  './fade/fade',
  './feedback/feedback',
  './identity/identity',
  './key/key',
  './login/login',
  './modal/modal',
  './navbar/navbar',
  './passcode/passcode',
  './placeholder/placeholder',
  './popoverTemplate/popoverTemplate',
  './selector/selector',
  './settings/settings',
  './slug/slug',
  './spinner/spinner',
  './submitForm/submitForm',
  './tabs/tabs',
  './util/util'
], function(angular) {

'use strict';

angular.module('app.components', [
  'app.dashboard',
  'app.duplicateChecker',
  'app.fade',
  'app.feedback',
  'app.identity',
  'app.key',
  'app.login',
  'app.modal',
  'app.navbar',
  'app.passcode',
  'app.placeholder',
  'app.popoverTemplate',
  'app.selector',
  'app.settings',
  'app.slug',
  'app.spinner',
  'app.submitForm',
  'app.tabs',
  'app.util'
]);

});
