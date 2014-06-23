/*!
 * Add Identity Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['AlertService', 'ModalService', 'IdentityService'];
return {addIdentityModal: deps.concat(factory)};

function factory(AlertService, ModalService, IdentityService) {
  function Ctrl($scope, config) {
    $scope.model = {};
    $scope.data = config.data;
    $scope.baseUrl = config.data.baseUri;
    $scope.loading = false;
    // identity
    $scope.identityType = $scope.identityTypes[0];
    $scope.identityLabel = '';
    $scope.identitySlug = '';
    $scope.identity = {};
    $scope.identityTypeLabels = {
      'Identity': 'Identity'
    };
    angular.forEach($scope.identityTypes, function(type) {
      $scope.identity[type] = {
        '@context': config.data.contextUrl,
        type: type
      };
    });

    $scope.addIdentity = function() {
      var identity = $scope.identity[$scope.identityType];
      identity.label = $scope.identityLabel;
      identity.sysSlug = $scope.identitySlug;
      $scope.loading = true;
      AlertService.clearModalFeedback($scope);
      var promise = IdentityService.add(identity);
      promise.then(function(identity) {
        $scope.loading = false;
        $scope.modal.close(null, {identity: identity});
        $scope.$apply();
      }).catch(function(err) {
        $scope.loading = false;
        AlertService.add('error', err);
        $scope.$apply();
      });
    };
  }

  return ModalService.directive({
    name: 'addIdentity',
    scope: {
      identityTypes: '='
    },
    templateUrl: '/app/components/identity/add-identity-modal.html',
    controller: ['$scope', 'config', Ctrl]
  });
}

});
