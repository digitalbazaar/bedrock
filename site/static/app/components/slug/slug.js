/*!
 * Slug module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'slug.filter',
  'slugIn.directive',
  'slugOut.directive'
], function(angular, filter, slugIn, slugOut) {

'use strict';

var module = angular.module('app.slug', []);

module.filter(filter);
module.directive(slugIn);
module.directive(slugOut);

});
