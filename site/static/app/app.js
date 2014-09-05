/*!
 * Main App module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'angular-animate',
  'angular-bootstrap',
  'angular-route',
  'angular-sanitize',
  'angular-ui-select',
  'bootstrap',
  'ng-multi-transclude',
  'promise',
  'stackables',
  'app/configs',
  'app/components/components',
  'app/templates'
], function(angular) {

'use strict';

var module = angular.module('app', [
  'multi-transclude', 'ngAnimate', 'ngRoute', 'ngSanitize',
  'ui.bootstrap', 'ui.select', 'stackables',
  'app.configs', 'app.components', 'app.templates']);
/* @ngInject */
module.config(function($locationProvider, $routeProvider, $httpProvider) {
  $locationProvider.html5Mode(true);
  $locationProvider.hashPrefix('!');

  // add non-route
  $routeProvider.otherwise({none: true});

  $httpProvider.useApplyAsync(true);

  // normalize errors, deal w/auth redirection
  /* @ngInject */
  $httpProvider.interceptors.push(function($rootScope, $q, $timeout) {
    return {
      request: function(config) {
        if('delay' in config) {
          return $timeout(function() {
            return config;
          }, config.delay);
        }
        return config;
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
module.run(function(
  $http, $location, $rootScope, $route, $window, config, util) {
  /* Note: $route is injected above to trigger watching routes to ensure
    pages are loaded properly. */

  // default headers
  $http.defaults.headers.common.Accept =
    'application/ld+json, application/json, text/plain, */*';
  $http.defaults.headers.common['X-Requested-With'] = 'XMLHttpRequest';

  // set site and page titles
  $rootScope.siteTitle = $window.data.siteTitle;
  $rootScope.pageTitle = $window.data.pageTitle;
  $rootScope.productionMode = $window.data.productionMode;
  $rootScope.demoWarningUrl = $window.data.demoWarningUrl;

  // build route regexes
  var routeRegexes = [];
  angular.forEach($route.routes, function(route, path) {
    routeRegexes.push({
      route: route,
      regex: getRouteRegex(path)
    });
  });

  // tracks whether current page is using an angular view
  var usingView = false;

  // do immediate initial location change prior to loading any page content
  // in case a redirect is necessary
  locationChangeStart();

  $rootScope.$on('$locationChangeStart', locationChangeStart);

  // monitor whether or not an angular view is in use
  $rootScope.$on('$viewContentLoaded', function() {
    usingView = true;
  });

  // route info
  $rootScope.route = {
    changing: false
  };

  $rootScope.$on('$routeChangeStart', function(event, next, current) {
    $rootScope.route.changing = true;
  });

  // set page vars when route changes
  $rootScope.$on('$routeChangeSuccess', function(event, current, previous) {
    $rootScope.route.changing = false;
    // FIXME: angular13 fix this
    if(current) {
      $rootScope.route.current = current;
      $rootScope.route.vars = current.vars || {};
      // FIXME: remove once routes switched to above vars object
      if(current.title) {
        $rootScope.route.vars.title = current.title;
      }
    } else {
      $rootScope.route.current = null;
      $rootScope.route.vars = {};
    }
  });

  // set page title when route changes
  $rootScope.$on('$routeChangeError', function(event) {
    $rootScope.route.changing = false;
  });

  // access to app core (utility functions, services, etc.)
  $rootScope.app = {
    jsonld: util.jsonld,
    services: {},
    util: util
  };

  function locationChangeStart(event) {
    // session auth check
    var authenticated = !!(config.data.session || {}).identity;

    // don't reload the same authenticated page
    if(authenticated && $window.location.href === $location.absUrl()) {
      return;
    }

    // determine if full page reload is needed, yes if:
    // 1. not changing location to the same page
    // 2. switching from non-view to view (non-route to route)
    // 3. switching from view to non-view
    var mustReload = ($window.location.href !== $location.absUrl());

    // if not authenticated or currently using view, see if there's
    // a route for the location (still using view) and if it requires a session
    if(!authenticated || usingView) {
      for(var i = 0; i < routeRegexes.length; ++i) {
        var entry = routeRegexes[i];
        if(entry.regex.test($location.path())) {
          // already using view and location is another route, so reload
          // is not necessary
          if(usingView) {
            mustReload = false;
            if(authenticated) {
              break;
            }
          }
          // no auth and session required, redirect to login
          if(!authenticated && entry.route.session === 'required') {
            $window.location.href = '/session/login';
            if(event) {
              event.preventDefault();
            } else {
              throw new Error('Session not found.');
            }
            return;
          }
        }
      }
    }

    if(mustReload) {
      $window.location.href = $location.absUrl();
      if(event) {
        event.preventDefault();
      } else {
        throw new Error('Switching route mode, reload required.');
      }
      return;
    }
  }
});

// bootstrap and set ng-app to indicate to test runner/other external apps
// that application has bootstrapped
var root = angular.element('html');
angular.bootstrap(root, ['app']);
root.attr('ng-app', 'app');

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
