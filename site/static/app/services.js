/*!
 * Services module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'app/services/constant',
  'app/services/identity',
  'app/services/key',
  'app/services/modal',
  'app/services/model',
  'app/services/resource',
  'app/services/templateCache'
], function(angular) {
  angular.module('app.services', []).factory(angular.extend.apply(
    null, [{}].concat(Array.prototype.slice.call(arguments, 2))));
});
