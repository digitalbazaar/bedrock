/*!
 * Profile Creation Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author Manu Sporny
 */
define([], function() {

'use strict';

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
    sysPassword: '',
    sysIdentity: {
      // FIXME: add option for type in ui?
      type: 'PersonalIdentity',
      label: '',
      sysSlug: '',
      sysPublic: []
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
