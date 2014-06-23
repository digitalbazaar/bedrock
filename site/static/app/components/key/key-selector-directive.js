/*!
 * Key Selector directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = [];
return {keySelector: deps.concat(factory)};

function factory() {
  function Ctrl($scope, KeyService) {
    var model = $scope.model = {};
    model.services = {
      key: KeyService.state
    };
    model.keys = KeyService.unrevokedKeys;
    $scope.$watch('model.keys', function(keys) {
      if(!$scope.selected || $.inArray($scope.selected, keys) === -1) {
        $scope.selected = keys[0] || null;
      }
    }, true);
    KeyService.collection.getAll();
  }

  function Link(scope, element, attrs) {
    attrs.$observe('fixed', function(value) {
      scope.fixed = value;
    });
  }

  return {
    scope: {
      selected: '=',
      invalid: '=',
      fixed: '@'
    },
    controller: ['$scope', 'KeyService', Ctrl],
    templateUrl: '/app/components/key/key-selector.html',
    link: Link
  };
}

});
