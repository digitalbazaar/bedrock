/*!
 * Alert Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = ['svcModal'];
return {modalAlert: deps.concat(factory)};

function factory(svcModal) {
  return svcModal.directive({
    name: 'Alert',
    transclude: true,
    templateUrl: '/app/templates/modals/alert.html',
    scope: {
      header: '@modalHeader',
      ok: '@modalOk',
      cancel: '@modalCancel'
    }
  });
}

});
