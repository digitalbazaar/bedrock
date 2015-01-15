/*!
 * Tabs.
 *
 * Adapted from angular.js directive documentation.
 *
 * Copyright (c) 2014-2015 Digital Bazaar, Inc. All rights reserved.
 *
 * @author David I. Lehn
 */
define(['angular'], function(angular) {

'use strict';

var deps = [];
return {
  brTabs: deps.concat(tabsFactory),
  brTabsPane: deps.concat(tabsPaneFactory)
};

function tabsFactory() {
  /* @ngInject */
  function Ctrl($scope) {
    var panes = $scope.panes = [];
    var panesMap = {};
    panesMap.none = [];

    this.select = $scope.select = function(pane) {
      if(typeof pane === 'number') {
        // select by index
        pane = pane[pane];
      }
      angular.forEach(panes, function(p) {
        if(typeof pane === 'string' && p.tabId === pane) {
          // select by tab ID
          pane = p;
        }
        p.selected = false;
      });
      if(typeof pane !== 'string') {
        pane.selected = true;
      }
    };

    this.addPane = function(pane, index) {
      // store pane order
      if(isNaN(parseInt(index, 10))) {
        panesMap.none.push(pane);
      } else {
        panesMap[index] = pane;
      }

      // rebuild panes
      panes.length = 0;
      Object.keys(panesMap).sort().forEach(function(key) {
        if(key === 'none') {
          panes.push.apply(panes, panesMap[key]);
        } else {
          panes.push(panesMap[key]);
        }
      });

      // select pane
      if(panes.length === 1 || index === 0) {
        $scope.select(pane);
      }
    };
  }

  return {
    restrict: 'A',
    transclude: true,
    scope: {},
    controller: Ctrl,
    templateUrl: '/app/components/tabs/tabs.html'
  };
}

function tabsPaneFactory() {
  function Link(scope, element, attrs, tabsCtrl) {
    // FIXME: why is this doing element.attr() should it be using $observe?
    scope.title = scope.title || attrs.brTitle || element.attr('br-title');
    scope.tabId = scope.tabId || attrs.brTabId || element.attr('br-tab-id');
    tabsCtrl.addPane(scope, scope.index);
  }

  return {
    require: '^brTabs',
    restrict: 'A',
    transclude: true,
    scope: {
      title: '@brTitle',
      index: '=?brTabPaneIndex',
      selected: '=?brSelected'
    },
    link: Link,
    templateUrl: '/app/components/tabs/tabs-pane.html'
  };
}

});
