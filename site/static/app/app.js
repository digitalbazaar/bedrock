/*!
 * Main App module.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'bootstrap',
  'ui-bootstrap',
  'ui-utils',
  'app/controllers',
  'app/directives',
  'app/filters',
  'app/services',
  'app/templates'
], function(angular) {
  var module = angular.module('app', [
    'app.templates', 'app.directives', 'app.filters', 'app.services',
    'app.controllers', 'ui.bootstrap', 'ui.utils']);
  module.run(['$rootScope', '$location', '$route', function(
    $rootScope, $location, $route) {
    /* Note: $route is injected above to trigger watching routes to ensure
      pages are loaded properly. */

    // reload page if switching between routes and non-routes
    $rootScope.$on('$routeChangeStart', function(event, next, last) {
      if(last && last !== next && (next.none || last.none)) {
        window.location.href = $location.absUrl();
      }
    });

    // utility functions
    var util = $rootScope.util = {};
    util.parseFloat = parseFloat;

    var jsonld = $rootScope.jsonld = {};
    jsonld.isType = function(obj, value) {
      var types = obj.type;
      if(types) {
        if(!angular.isArray(types)) {
          types = [types];
        }
        return types.indexOf(value) !== -1;
      }
      return false;
    };
  }]);

  angular.bootstrap(document, ['app']);
});
