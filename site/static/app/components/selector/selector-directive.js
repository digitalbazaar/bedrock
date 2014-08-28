/*!
 * Base Selector Directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  /* ngInject */
  function Controller($scope) {
    var self = this;
    self.selected = null;

    self.select = function(item) {
      self.selected = item;
      self.showChoices = false;
      if($scope.selected) {
        $scope.selected({selected: item});
      }
    };
  }

  return {
    restrict: 'E',
    scope: {
      selected: '&?brSelected'
    },
    transclude: true,
    templateUrl: '/app/components/selector/selector.html',
    controller: Controller,
    controllerAs: 'model'
  };
}

return {brSelector: factory};

});
