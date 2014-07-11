/*!
 * Identity Selector directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    scope: {
      identityTypes: '=',
      identities: '=',
      selected: '=',
      invalid: '=',
      fixed: '@'
    },
    templateUrl: '/app/components/identity/identity-selector.html',
    link: function(scope, element, attrs) {
      attrs.$observe('fixed', function(value) {
        scope.fixed = value;
      });
    }
  };
}

return {identitySelector: factory};

});
