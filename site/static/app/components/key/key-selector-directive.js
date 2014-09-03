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
function keySelectorInner(brKeyService) {
  return {
    restrict: 'A',
    require: 'brSelector',
    link: Link
  };

  function Link(scope, element, attrs, brSelector) {
    var model = scope.model = {};
    model.services = {
      key: brKeyService.state
    };
    model.keys = brKeyService.unrevokedKeys;
    scope.$watch('model.keys', function(keys) {
      if(!scope.selected || $.inArray(scope.selected, keys) === -1) {
        scope.selected = keys[0] || null;
      }
    }, true);

    // configure brSelector
    scope.brSelector = brSelector;
    brSelector.itemType = 'Key';
    brSelector.items = model.keys;
    brSelector.addItem = function() {
      model.showAddKeyModal = true;
    };
    scope.$watch('fixed', function(value) {
      brSelector.fixed = value;
    });

    brKeyService.collection.getAll();
  }
}

/* @ngInject */
function keySelector() {
  return {
    restrict: 'EA',
    scope: {
      selected: '=brSelected',
      invalid: '=brInvalid',
      fixed: '=?brFixed'
    },
    templateUrl: '/app/components/key/key-selector.html'
  };
}

return {brKeySelector: keySelector, brKeySelectorInner: keySelectorInner};

});
