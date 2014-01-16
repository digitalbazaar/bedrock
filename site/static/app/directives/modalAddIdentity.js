/*!
 * Add Identity Modal.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

var deps = ['svcModal', 'svcIdentity'];
return {modalAddIdentity: deps.concat(factory)};

function factory(svcModal, svcIdentity) {
  function Ctrl($scope) {
    $scope.baseUrl = window.location.protocol + '//' + window.location.host;
    $scope.model = {};
    $scope.data = window.data || {};
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
        '@context': bedrock.CONTEXT_URL,
        type: type
      };
    });

    $scope.addIdentity = function() {
      var identity = $scope.identity[$scope.identityType];
      identity.label = $scope.identityLabel;
      identity.psaSlug = $scope.identitySlug;
      $scope.loading = true;
      svcIdentity.add(identity, function(err, identity) {
        // if identity is a duplicate, update id
        if(err.type === 'bedrock.website.DuplicateIdentity') {
          identity.id = $scope.baseUrl + '/i/' + identity.psaSlug;
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
    controller: ['$scope', Ctrl],
    link: function(scope, element, attrs) {
      scope.feedbackTarget = element;
    }
  });
}

});
