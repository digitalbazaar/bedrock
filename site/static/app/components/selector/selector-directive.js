/*!
 * Base Selector.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($compile, $filter, $timeout) {
  return {
    transclude: true,
    scope: {
      fixed: '@brFixed',
      items: '=brItems',
      itemType: '@brItemType',
      modalTitle: '@brModalTitle',
      selected: '=brSelected',
      invalid: '=brInvalid',
      addItem: '&brAddItem',
      custom: '=brCustomDisplay',
      selecting: '=brSelecting'
    },
    templateUrl: '/app/components/selector/selector.html',
    link: Link
  };

  function Link(scope, element, attrs, ctrl, transcludeFn) {
    scope.model = {};

    var orderBy = $filter('orderBy');
    var sortedItems;
    scope.$watch('items', function(items) {
      sortedItems = orderBy(items, 'label');
    }, true);

    scope.$watch('selected', function(value) {
      if(value === undefined) {
        scope.selected = scope.items[0] || null;
      }
      if(scope.selected !== null) {
        // selection made, close modal
        scope.showSelectorModal = false;
      }
    });

    attrs.$observe('brFixed', function(value) {
      scope.fixed = value;
    });

    var previousSelection = null;
    scope.$watch('showSelectorModal', function(value) {
      if(attrs.brSelecting) {
        scope.selecting = value;
      }
      if(!value) {
        // no selection made; restore previous one
        if(scope.selected === null) {
          scope.selected = previousSelection;
        }
        return;
      }
      $timeout(function() {
        // clear selection
        previousSelection = scope.selected;
        scope.selected = null;

        // clear custom display
        var custom = findByScope(
          angular.element('.br-selector-transclude-custom'), scope);
        custom.empty();

        // clear default list display
        var list = findByScope(
          angular.element('.br-selector-list'), scope);
        list.empty();

        // build custom display
        if(scope.custom) {
          transcludeFn(function(clone) {
            custom.append(clone);
          });
          return;
        }

        // build default list display
        angular.forEach(sortedItems, function(item, idx) {
          var li = angular.element(
            '<li class="br-item-hover well" ng-click="select(' + idx + ')">');
          $compile(li)(scope);
          list.append(li);
          var child = scope.$new();
          child.selected = item;
          transcludeFn(child, function(clone) {
            clone.on('$destroy', function() {
              child.$destroy();
            });
            li.append(clone);
          });
        });
      });
    });

    // called when an item is selected in the selector modal
    scope.select = function(selectedIdx) {
      scope.selected = sortedItems[selectedIdx];
      scope.showSelectorModal = false;
    };

    function findByScope(element, scope) {
      return element.filter(function(i, e) {
        // FIXME: brittle -- find a better way to do this
        var child = angular.element(e).scope();
        if(!(child && child.$parent && child.$parent.$parent)) {
          return false;
        }
        return child.$parent.$parent === scope;
      });
    }
  };
}

return {brSelector: factory};

});
