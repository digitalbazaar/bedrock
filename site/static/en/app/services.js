/*!
 * Services module.
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
  'app/services/templateCache'
], function(angular) {
  angular.module('app.services', []).factory(angular.extend.apply(
    null, [{}].concat(Array.prototype.slice.call(arguments, 1))));
});
