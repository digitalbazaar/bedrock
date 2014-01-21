/*!
 * Filters module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'app/filters/ceil',
  'app/filters/ellipsis',
  'app/filters/embeddedString',
  'app/filters/encodeURIComponent',
  'app/filters/floor',
  'app/filters/mask',
  'app/filters/now',
  'app/filters/prefill',
  'app/filters/slug'
], function(angular) {
  var module = angular.module('app.filters', []);
  var filters = angular.extend.apply(
    null, [{}].concat(Array.prototype.slice.call(arguments, 1)));
  angular.forEach(filters, function(filter, name) {
    module.filter(name, filter);
  });
});
