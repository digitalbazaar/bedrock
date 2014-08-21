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
      for(var key in panesMap) {
        if(key !== null) {
          panes[key] = panesMap[key];
        }
      }
      panes.push.apply(panes, panesMap[null]);

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
