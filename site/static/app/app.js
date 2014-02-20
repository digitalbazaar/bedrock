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
  'promise',
  'app/configs',
  'app/controllers',
  'app/directives',
  'app/filters',
  'app/services',
  'app/templates'
], function(angular) {

  'use strict';

  var module = angular.module('app', [
    'app.templates', 'app.directives', 'app.filters', 'app.services',
    'app.controllers', 'app.configs', 'ui.bootstrap', 'ui.utils']);
  module.config(['$httpProvider', function($httpProvider) {
    // TODO: interceptor API changed after angular 1.0.x
    // normalize errors, deal w/auth redirection
    $httpProvider.responseInterceptors.push(['$q', '$timeout', function(
      $q, $timeout) {
      return function(promise) {
        return promise.then(function(response) {
          if('delay' in response.config) {
            var defer = $q.defer();
            $timeout(function() {
              defer.resolve(response);
            }, response.config.delay);
            return defer.promise;
          }
          return response;
        }, function(response) {
          var error = response.data || {};
          if(error.type === undefined) {
            error.type = 'website.Exception';
            error.message =
              'An error occurred while communicating with the server: ' +
              (response.statusText || ('HTTP ' + response.status));
          }
          // check for invalid session or missing session
          else if(error.type === 'bedrock.website.PermissionDenied') {
            // redirect to login
            // TODO: support modal login to keep state vs forced redirect
            window.location = '/profile/login?ref=' +
              encodeURIComponent(window.location.pathname) +
              '&expired=true';
          }
          return $q.reject(error);
        });
      };
    }]);
  }]);
  module.run(['$rootScope', '$location', '$route', '$http', function(
    $rootScope, $location, $route, $http) {
    /* Note: $route is injected above to trigger watching routes to ensure
      pages are loaded properly. */

    // accept JSON-LD
    $http.defaults.headers.common.Accept =
      'application/ld+json, application/json, text/plain, */*';

    // set site and page titles
    $rootScope.siteTitle = window.data.siteTitle;
    $rootScope.pageTitle = window.data.pageTitle;

    // build route regexes
    var routeRegexes = [];
    angular.forEach($route.routes, function(route, path) {
      routeRegexes.push(getRouteRegex(path));
    });

    // tracks whether current page is using an angular view
    var usingView = false;

    // determine if full page reload is needed, yes if:
    // 1. not changing location to the same page
    // 2. switching from non-view to view (non-route to route)
    // 3. switching from view to non-view
    $rootScope.$on('$locationChangeStart', function(event, next, last) {
      // don't reload same page
      if(window.location.href === $location.absUrl()) {
        return;
      }
      // if currently using view, test location to see if its a route
      var mustReload = true;
      for(var i = 0; usingView && i < routeRegexes.length; ++i) {
        // location is a route and already using angular view
        if(routeRegexes[i].test($location.path())) {
          mustReload = false;
          break;
        }
      }
      if(mustReload) {
        window.location.href = $location.absUrl();
        event.preventDefault();
      }
    });

    // monitor whether or not an angular view is in use
    $rootScope.$on('$viewContentLoaded', function() {
      usingView = true;
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
    var regex = '', params = [];
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
