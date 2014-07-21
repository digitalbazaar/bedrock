/*!
 * Main App module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'angular-route',
  'angular-sanitize',
  'angular-ui-select2',
  'bootstrap',
  'ui-bootstrap',
  'ui-utils',
  'promise',
  'stackables',
  'app/configs',
  'app/components/components',
  'app/templates'
], function(angular) {

'use strict';

var module = angular.module('app', [
  'ngRoute', 'ngSanitize', 'ui.bootstrap', 'ui.select2', 'ui.utils',
  'stackables', 'app.configs', 'app.components', 'app.templates']);
/* @ngInject */
module.config(function($locationProvider, $routeProvider, $httpProvider) {
    $locationProvider.html5Mode(true);
    $locationProvider.hashPrefix('!');

    // add non-route
    $routeProvider.otherwise({none: true});

    // normalize errors, deal w/auth redirection
    /* @ngInject */
    $httpProvider.interceptors.push(function($rootScope, $q, $timeout) {
      return {
        response: function(response) {
          if('delay' in response.config) {
            var defer = $q.defer();
            $timeout(function() {
              defer.resolve(response);
            }, response.config.delay);
            return defer.promise;
          }
          return response;
        },
        responseError: function(response) {
          var error = response.data || {};
          if(error.type === undefined) {
            error.type = 'website.Exception';
            error.message =
              'An error occurred while communicating with the server: ' +
              (response.statusText || ('HTTP ' + response.status));
          } else if(error.type === 'bedrock.website.PermissionDenied') {
            // invalid session or missing session, show login modal
            $rootScope.$emit('showLoginModal');
          }
          return $q.reject(error);
        }
      };
    });
});

// utility functions
var util = {};
module.value('util', util);
util.parseFloat = parseFloat;

var jsonld = util.jsonld = {};
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

util.w3cDate = function(date) {
  if(date === undefined || date === null) {
    date = new Date();
  } else if(typeof date === 'number' || typeof date === 'string') {
    date = new Date(date);
  }
  return (
    date.getUTCFullYear() + '-' +
    util.zeroFill(date.getUTCMonth() + 1) + '-' +
    util.zeroFill(date.getUTCDate()) + 'T' +
    util.zeroFill(date.getUTCHours()) + ':' +
    util.zeroFill(date.getUTCMinutes()) + ':' +
    util.zeroFill(date.getUTCSeconds()) + 'Z');
};
util.zeroFill = function(num) {
  return (num < 10) ? '0' + num : '' + num;
};

/* @ngInject */
module.run(function($rootScope, $location, $route, $http, util) {
  /* Note: $route is injected above to trigger watching routes to ensure
    pages are loaded properly. */

  // default headers
  $http.defaults.headers.common.Accept =
    'application/ld+json, application/json, text/plain, */*';
  $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

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
    // FIXME: angular13 fix this
    if(current && current.$$route) {
      $rootScope.pageTitle = current.$$route.title;
    }
  });

  // access to app core (utility functions, services, etc.)
  $rootScope.app = {
    jsonld: util.jsonld,
    services: {},
    util: util
  };
});

angular.bootstrap(document.body, ['app']);

// set ng-app to indicate to test runner that application has bootstrapped
angular.element('body').attr('ng-app', 'app');

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
