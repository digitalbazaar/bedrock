/*!
 * Profile Creation Controller.
 *
 * @author Dave Longley
 * @author Manu Sporny
 */
define([], function() {

var deps = ['$scope', '$http'];
return {CreateProfileCtrl: deps.concat(factory)};

function factory($scope, $http) {
  $scope.model = {};
  $scope.data = window.data || {};
  $scope.feedback = {};
  // FIXME: temporary code to be removed after feedback improvements.
  //      : also remove the id fom the form in create.tpl.
  $scope.feedbackTarget = $('#createProfileFeedbackTarget');
  $scope.loading = false;
  $scope.profile = {
    '@context': $scope.data.contextUrl,
    email: '',
    psaPassword: '',
    psaIdentity: {
      // FIXME: add option for type in ui?
      type: 'PersonalIdentity',
      label: '',
      psaSlug: '',
      psaPublic: []
    }
  };
  $scope.agreementChecked = false;

  $scope.submit = function() {
    $scope.loading = true;
    $http.post('/profile/create', $scope.profile)
      .success(function(response) {
        // redirect to referral URL
        window.location = response.ref;
      })
      .error(function(err, status) {
        $scope.loading = false;
        $scope.feedback.error = err;
      });
  };
}

});
