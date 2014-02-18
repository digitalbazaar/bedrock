/*!
 * Edit Key Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

'use strict';

var deps = ['svcModal'];
return {modalEditKey: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope, config, svcKey) {
    $scope.model = {};
    $scope.data = config.data;
    $scope.feedback = {};
    $scope.identity = config.data.identity || {};
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
      svcKey.update(key, function(err, key) {
        $scope.loading = false;
        if(!err) {
          $scope.modal.close(null, key);
        }
        $scope.feedback.error = err;
      });
    };
  }

  return svcModal.directive({
    name: 'EditKey',
    scope: {sourceKey: '=key'},
    templateUrl: '/app/templates/modals/edit-key.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl],
    link: function(scope, element, attrs) {
      scope.feedbackTarget = element;
    }
  });
}

});
