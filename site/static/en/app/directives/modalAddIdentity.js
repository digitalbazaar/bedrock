/*!
 * Add Identity Modal.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

var deps = ['svcModal', 'svcIdentity', 'svcAccount'];
return {modalAddIdentity: deps.concat(factory)};

function factory(svcModal, svcIdentity, svcAccount) {
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
      'PersonalIdentity': 'Personal',
      'VendorIdentity': 'Vendor'
    };
    angular.forEach($scope.identityTypes, function(type) {
      $scope.identity[type] = {
        '@context': bedrock.CONTEXT_URL,
        type: type
      };
    });

    // account
    $scope.account = {
      '@context': bedrock.CONTEXT_URL,
      label: 'Primary Account',
      psaSlug: 'primary',
      currency: 'USD',
      psaPublic: []
    };
    $scope.accountVisibility = 'hidden';

    $scope.addIdentity = function() {
      var identity = $scope.identity[$scope.identityType];
      identity.label = $scope.identityLabel;
      identity.psaSlug = $scope.identitySlug;
      $scope.loading = true;
      svcIdentity.add(identity, function(err, identity) {
        if(!err) {
          return addAccount(identity);
        }

        // if identity is a duplicate, add account to it
        if(err.type === 'bedrock.website.DuplicateIdentity') {
          identity.id = $scope.baseUrl + '/i/' + identity.psaSlug;
          return addAccount(identity);
        }

        $scope.loading = false;
        $scope.feedback.error = err;
      });
    };

    function addAccount(identity) {
      $scope.account.psaPublic = [];
      if($scope.accountVisibility === 'public') {
        $scope.account.psaPublic.push('label');
        $scope.account.psaPublic.push('owner');
      }

      // add account
      svcAccount.add($scope.account, identity.id, function(err, account) {
        $scope.loading = false;
        if(!err) {
          $scope.modal.close(null, {identity: identity, account: account});
        }
        // FIXME: identity vs account feedback
        $scope.feedback.error = err;
      });
    }
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
