/*!
 * Selector Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'A',
    scope: {
      modalTitle: '=',
      items: '=',
      itemType: '='
    },
    require: '^stackable',
    transclude: true,
    templateUrl: '/app/components/selector/selector-modal.html'
  };
}

return {selectorModal: factory};

});
