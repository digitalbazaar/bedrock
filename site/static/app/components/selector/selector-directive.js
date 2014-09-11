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
  function Controller() {
    var self = this;
    self.selected = null;

    self.select = function(item) {
      self.selected = item;
      self.showChoices = false;
      if(self.selectedCallback) {
        self.selectedCallback({selected: item});
      }
    };
  }

  return {
    restrict: 'E',
    scope: {
      selectedCallback: '&?brSelected'
    },
    transclude: true,
    templateUrl: '/app/components/selector/selector.html',
    controller: Controller,
    controllerAs: 'model',
    bindToController: true
  };
}

return {brSelector: factory};

});
