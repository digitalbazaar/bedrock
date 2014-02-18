/*!
 * Add Identity Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

'use strict';

var deps = ['svcModal', 'svcIdentity'];
return {modalAddIdentity: deps.concat(factory)};

function factory(svcModal, svcIdentity) {
  function Ctrl($scope, config) {
    $scope.model = {};
    $scope.data = config.data;
    $scope.baseUrl = config.data.baseUri;
    $scope.feedback = {};
    $scope.loading = false;
    // identity
    $scope.identityType = $scope.identityTypes[0];
    $scope.identityLabel = '';
    $scope.identitySlug = '';
    $scope.identity = {};
    $scope.identityTypeLabels = {
      'PersonalIdentity': 'Personal'
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
      svcIdentity.add(identity, function(err, identity) {
        // if identity is a duplicate, update id
        if(err.type === 'bedrock.website.DuplicateIdentity') {
          identity.id = $scope.data.identityBaseUri + '/' + identity.sysSlug;
        }

        $scope.loading = false;
        $scope.feedback.error = err;
      });
    };
  }

  return svcModal.directive({
    name: 'AddIdentity',
    scope: {
      identityTypes: '='
    },
    templateUrl: '/app/templates/modals/add-identity.html',
    controller: ['$scope', 'config', Ctrl],
    link: function(scope, element, attrs) {
      scope.feedbackTarget = element;
    }
  });
}

});
