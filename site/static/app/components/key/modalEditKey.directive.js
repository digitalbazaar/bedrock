/*!
 * Edit Key Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['svcModal'];
return {modalEditKey: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope, config, svcKey) {
    var model = $scope.model = {};
    $scope.data = config.data;
    $scope.feedback = {};
    $scope.identity = config.data.identity || {};
    model.mode = 'edit';
    // copy source budget for editing
    $scope.key = {};
    angular.extend($scope.key, $scope.sourceKey);

    $scope.editKey = function() {
      // set all fields from UI
      var key = {
        '@context': config.data.contextUrl,
        id: $scope.key.id,
        label: $scope.key.label
      };

      $scope.loading = true;
      var promise = svcKey.collection.update(key);
      promise.then(function(key) {
        $scope.loading = false;
        $scope.modal.close(null, key);
        $scope.feedback.error = null;
        $scope.$apply();
      }).catch(function(err) {
        $scope.loading = false;
        $scope.feedback.error = err;
        $scope.$apply();
      });
    };
  }

  return svcModal.directive({
    name: 'EditKey',
    scope: {sourceKey: '=key'},
    templateUrl: '/app/components/key/modal-edit-key.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl],
    link: function(scope, element, attrs) {
      scope.feedbackTarget = element;
    }
  });
}

});
