/*!
 * Alerts directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($rootScope) {
  return {
    scope: {filterOrigin: '@?', fixed: '@?'},
    templateUrl: '/app/components/util/alerts.html',
    link: function(scope, element, attrs) {
      scope.app = $rootScope.app;
      scope.feedback = [];
      attrs.$observe('alertCategory', function(value) {
        if(value === undefined) {
          scope.alertCategory = 'all';
        }
      });
    }
  };
}

return {alerts: factory};

});
