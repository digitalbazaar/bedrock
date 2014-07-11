/*!
 * Modal Footer Directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(ModalService) {
  return {
    replace: true,
    transclude: true,
    templateUrl: '/app/components/modal/modal-footer.html',
    link: function(scope, element) {
      // TODO: change to directive for closing top-level modal
      // auto-bind any .btn-close classes
      $('.btn-close', element).click(function(e) {
        e.preventDefault();
        ModalService.cancelTopModal();
      });
    }
  };
}

return {modalFooter: factory};

});
