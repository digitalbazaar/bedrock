/*!
 * Alerts directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$rootScope'];
return {alerts: deps.concat(factory)};

function factory($rootScope) {
  return {
    scope: {filterOrigin: '@?'},
    templateUrl: '/app/components/util/alerts.html',
    link: function(scope, element, attrs) {
      scope.app = $rootScope.app;
      scope.feedback = [];
      scope.filterOrigin = scope.filterOrigin || 'all';
    }
  };
}

});
