/*!
 * Selector Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['svcModal'];
return {modalSelector: deps.concat(factory)};

function factory(svcModal) {
  return svcModal.directive({
    name: 'Selector',
    scope: {
      modalTitle: '=',
      items: '=',
      itemType: '='
    },
    transclude: true,
    templateUrl: '/app/components/selector/selector-modal.html'
  });
}

});
