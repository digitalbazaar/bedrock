/*!
 * Alert Modal.
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
    require: '^stackable',
    scope: {
      header: '@brModalHeader',
      ok: '@brModalOk',
      cancel: '@brModalCancel'
    },
    transclude: true,
    templateUrl: '/app/components/modal/alert-modal.html',
    link: function(scope, element, attrs, stackable) {
      scope.stackable = stackable;
    }
  };
}

return {brAlertModal: factory};

});
