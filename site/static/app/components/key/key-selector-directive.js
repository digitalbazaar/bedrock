/*!
 * Key Selector directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(KeyService) {
  return {
    restrict: 'A',
    scope: {
      selected: '=brSelected',
      invalid: '=brInvalid',
      fixed: '@brFixed'
    },
    templateUrl: '/app/components/key/key-selector.html',
    link: Link
  };

  function Link(scope, element, attrs) {
    var model = scope.model = {};
    model.services = {
      key: KeyService.state
    };
    model.keys = KeyService.unrevokedKeys;
    scope.$watch('model.keys', function(keys) {
      if(!scope.selected || $.inArray(scope.selected, keys) === -1) {
        scope.selected = keys[0] || null;
      }
    }, true);
    attrs.$observe('brFixed', function(value) {
      scope.fixed = value;
    });
    KeyService.collection.getAll();
  }
}

return {brKeySelector: factory};

});
