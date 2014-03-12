/*!
 * Identity Creation Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['$scope', '$http'];
return {CreateIdentityCtrl: deps.concat(factory)};

function factory($scope, $http) {
  $scope.model = {};
  $scope.data = window.data || {};
  $scope.feedback = {};
  // FIXME: temporary code to be removed after feedback improvements.
  //      : also remove the id fom the form in create.tpl.
  $scope.feedbackTarget = $('#createIdentityFeedbackTarget');
  $scope.loading = false;
  $scope.identity = {
    '@context': $scope.data.contextUrl,
    type: 'Identity',
    label: '',
    email: '',
    sysPassword: '',
    sysPublic: [],
    sysSlug: ''
  };
  $scope.agreementChecked = false;

  $scope.submit = function() {
    if(!$scope.agreementChecked) {
      return false;
    }
    $scope.loading = true;
    $http.post('/join', $scope.identity)
      .success(function(response) {
        // redirect to referral URL
        window.location = response.ref;
      })
      .error(function(err) {
        $scope.loading = false;
        $scope.feedback.error = err;
      });
  };
}

});
