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
  tabs: deps.concat(tabsFactory),
  tabsPane: deps.concat(tabsPaneFactory)
};

function tabsFactory() {
  function Ctrl($scope) {
    var panes = $scope.panes = [];

    $scope.select = function(pane) {
      angular.forEach(panes, function(pane) {
        pane.selected = false;
      });
      pane.selected = true;
    };

    this.addPane = function(pane, index) {
      if(panes.length === 0 || index === 0) {
        $scope.select(pane);
      }
      if(typeof index === undefined || index >= panes.length) {
        panes.push(pane);
      }
      else {
        panes.splice(index, 0, pane);
      }
    };
  }

  return {
    restrict: 'A',
    transclude: true,
    scope: {},
    controller: ['$scope', Ctrl],
    templateUrl: '/app/components/tabs/tabs.html'
  };
}

function tabsPaneFactory() {
  function Link(scope, element, attrs, tabsCtrl) {
    scope.title = scope.title || attrs.title || element.attr('title');
    scope.tabId = scope.tabId || attrs.tabId || element.attr('tab-id');
    tabsCtrl.addPane(scope, element.parent().index());
  }

  return {
    require: '^tabs',
    restrict: 'A',
    transclude: true,
    scope: {
      title: '@'
    },
    link: Link,
    templateUrl: '/app/components/tabs/tabs-pane.html'
  };
}

});
