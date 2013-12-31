/*!
 * Login Support.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

var deps = ['$scope'];
return {LoginCtrl: deps.concat(factory)};

function factory($scope) {
  $scope.model = {};
  var data = window.data;
  $scope.multiple = false;
  $scope.loading = false;
  $scope.error = '';
  $scope.profile = '';
  $scope.password = '';
  $scope.ref = data.ref;
  $scope.model.siteTitle = data.siteTitle;
  $scope.model.sessionExpired = data.sessionExpired || false;

  $scope.submit = function() {
    // do login
    $scope.error = '';
    $scope.loading = true;
    bedrock.profiles.login({
      profile: $scope.profile,
      password: $scope.password,
      ref: $scope.ref,
      success: function(response) {
        // if a 'ref' is returned, login was successful
        if(response.ref) {
          // redirect to referral URL
          window.location = response.ref;
        }
        else {
          // show multiple profiles
          $scope.multiple = true;
          $scope.email = response.email;
          $scope.choices = [];
          angular.forEach(response.profiles, function(identity, profileId) {
            $scope.choices.push({id: profileId, label: identity.label});
          });
          $scope.profile = $scope.choices[0].id;
          $scope.loading = false;
          $scope.$apply();
        }
      },
      error: function(err) {
        // FIXME: use directive to show feedback?
        if(err.type === 'bedrock.validation.ValidationError') {
          $scope.error = 'Please enter your email address and password.';
        }
        else {
          $scope.error = err.message;
        }
        $scope.loading = false;
        $scope.$apply();
      }
    });
  };
}

});
