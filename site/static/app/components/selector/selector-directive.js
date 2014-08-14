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
      fixed: '@',
      items: '=',
      itemType: '@',
      modalTitle: '@',
      selected: '=',
      invalid: '=',
      addItem: '&',
      custom: '=customDisplay',
      selecting: '=',
      columns: '@'
    },
    templateUrl: '/app/components/selector/selector.html',
    link: Link
  };

  function Link(scope, element, attrs, ctrl, transcludeFn) {
    scope.model = {};

    scope.grid = [];
    scope.$watch('columns', function(value) {
      if(value === undefined) {
        return;
      }
      buildGrid(Math.max(1, parseInt(value, 10)));
    });

    var orderBy = $filter('orderBy');
    var sortedItems;
    scope.$watch('items', function(items) {
      sortedItems = orderBy(items, 'label');

      // keep grid up-to-date
      if(scope.columns !== undefined) {
        buildGrid(Math.max(1, parseInt(scope.columns, 10)));
      }
    }, true);

    scope.$watch('selected', function(value) {
      if(value === undefined) {
        scope.selected = scope.items[0] || null;
      }
    });

    attrs.$observe('fixed', function(value) {
      scope.fixed = value;
    });

    scope.$watch('showSelectorModal', function(value) {
      if(attrs.selecting) {
        scope.selecting = value;
      }
      if(!value) {
        return;
      }
      $timeout(function() {
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
            '<li class="item-hover well" ng-click="select(' + idx + ')">');
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

    // builds an item grid for selectors w/grid layouts
    function buildGrid(columns) {
      var row = null;
      scope.grid = [];
      angular.forEach(sortedItems, function(item) {
        if(!row) {
          row = [];
        }
        row.push(item);
        if(row.length === columns) {
          scope.grid.push(row);
          row = null;
        }
      });
      if(row) {
        scope.grid.push(row);
      }
    }

    function findByScope(element, scope) {
      return element.filter(function(i, e) {
        // FIXME: brittle -- find a better way to do this
        var child = angular.element(e).scope();
        if(!(child && child.$parent&& child.$parent.$parent)) {
          return false;
        }
        return child.$parent.$parent === scope;
      });
    }
  };
}

return {selector: factory};

});
