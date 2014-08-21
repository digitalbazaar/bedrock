/*!
 * Tabs.
 *
 * Adapted from angular.js directive documentation.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
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
    panesMap[null] = [];

    $scope.select = function(pane) {
      angular.forEach(panes, function(pane) {
        pane.selected = false;
      });
      pane.selected = true;
    };

    this.addPane = function(pane, index) {
      // store pane order
      if(typeof index === undefined) {
        panesMap[null].push(pane);
      } else {
        panesMap[index] = pane;
      }

      // rebuild panes
      panes.length = 0;
      Object.keys(panesMap).sort().forEach(function(key) {
        if(key === null) {
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
    tabsCtrl.addPane(scope, element.parent().index());
  }

  return {
    require: '^brTabs',
    restrict: 'A',
    transclude: true,
    scope: {
      title: '@brTitle'
    },
    link: Link,
    templateUrl: '/app/components/tabs/tabs-pane.html'
  };
}

});
