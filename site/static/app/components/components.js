/*!
 * Components module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './alert/alert',
  './dashboard/dashboard',
  './duplicate-checker/duplicate-checker',
  './identity/identity',
  './key/key',
  './login/login',
  './modal/modal',
  './navbar/navbar',
  './passcode/passcode',
  './placeholder/placeholder',
  './remote-file-selector/remote-file-selector',
  './selector/selector',
  './settings/settings',
  './slug/slug',
  './spinner/spinner',
  './submit-form/submit-form',
  './tabs/tabs',
  './util/util'
], function(angular) {

'use strict';

angular.module('app.components', Array.prototype.slice.call(arguments, 1));

});
