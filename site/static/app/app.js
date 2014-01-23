/*!
 * Main App module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
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

    // set site and page titles
    $rootScope.siteTitle = window.data.siteTitle;
    $rootScope.pageTitle = window.data.pageTitle;

    // build route regexes
    var routeRegexes = [];
    angular.forEach($route.routes, function(route, path) {
      routeRegexes.push(getRouteRegex(path));
    });

    // reload page if switching between routes and non-routes
    $rootScope.$on('$locationChangeStart', function(event, next, last) {
      // test location to see if it's a route
      var isRoute = false;
      for(var i = 0; i < routeRegexes.length; ++i) {
        if(routeRegexes[i].test($location.path())) {
          isRoute = true;
          break;
        }
      }
      if(!isRoute && window.location.href !== $location.absUrl()) {
        window.location.href = $location.absUrl();
        event.preventDefault();
      }
    });

    // set page title when route changes
    $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
      if(current && current.$$route) {
        $rootScope.pageTitle = current.$$route.title;
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

  // from angular.js for route matching
  // TODO: could probably be simplified
  function getRouteRegex(when) {
    // Escape regexp special characters.
    when = '^' + when.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '$';
    var regex = '', params = [], dst = {};
    var re = /:(\w+)/g, paramMatch, lastMatchedIndex = 0;
    while((paramMatch = re.exec(when)) !== null) {
      // Find each :param in `when` and replace it with a capturing group.
      // Append all other sections of when unchanged.
      regex += when.slice(lastMatchedIndex, paramMatch.index);
      regex += '([^\\/]*)';
      params.push(paramMatch[1]);
      lastMatchedIndex = re.lastIndex;
    }
    // Append trailing path part.
    regex += when.substr(lastMatchedIndex);
    return new RegExp(regex);
  }
});
