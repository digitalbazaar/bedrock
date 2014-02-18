/*!
 * Switch Identity Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['bedrock.api'], function(bedrock) {

'use strict';

var deps = ['svcModal', 'svcIdentity'];
return {modalSwitchIdentity: deps.concat(factory)};

function factory(svcModal, svcIdentity) {
  function Ctrl($scope) {
    $scope.model = {};
    $scope.data = window.data || {};
    $scope.identityTypes = ['PersonalIdentity'];
    $scope.identities = svcIdentity.identities;
    $scope.selected = svcIdentity.identity;

    $scope.switchIdentity = function() {
      // if current url starts with identity base path,
      // then switch to other identity's dashboard
      var identity = $scope.selected;
      var redirect = window.location.href;
      if(window.location.pathname.indexOf($scope.data.identityBasePath) === 0) {
        redirect = identity.id + '/dashboard';
      }

      bedrock.switchIdentity({
        identity: identity.id,
        redirect: redirect
      });
    };
  }

  return svcModal.directive({
    name: 'SwitchIdentity',
    templateUrl: '/app/templates/modals/switch-identity.html',
    controller: ['$scope', Ctrl]
  });
}

});
