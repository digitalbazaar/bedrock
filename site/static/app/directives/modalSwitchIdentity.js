/*!
 * Switch Identity Modal.
 *
 * @author Dave Longley
 */
define(['bedrock.api'], function(bedrock) {

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
      // if current url starts with '/i', switch to other identity's dashboard
      var identity = $scope.selected;
      var redirect = window.location.href;
      if(window.location.pathname.indexOf('/i') === 0) {
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
