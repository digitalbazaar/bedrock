/*!
 * Remote file selection modal.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['svcModal'];
return {modalSelectRemoteFile: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope) {
    var model = $scope.model = {};

    model.feedback = {};
    model.loading = false;

    model.loadSelectedFile = function() {
      model.loading = true;
    }
  }

  function Link(scope, element, attrs) {
    scope.model.feedbackTarget = element;
  }

  return svcModal.directive({
    name: 'SelectRemoteFile',
    templateUrl:
      '/app/components/remoteFileSelector/modal-remote-file-selector.html',
    controller: ['$scope', Ctrl],
    link: Link
  });
}

});
