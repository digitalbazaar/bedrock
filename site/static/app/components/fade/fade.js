/*!
 * Fade module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'fadein.directive',
  'fadeout.directive',
  'fadeToggle.directive'
], function(angular, fadein, fadeout, fadeToggle) {

'use strict';

var module = angular.module('app.fade', []);

module.directive(fadein);
module.directive(fadeout);
module.directive(fadeToggle);

});
