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

var deps = ['$scope', '$http', '$window', 'config'];
return {CreateIdentityCtrl: deps.concat(factory)};

function factory($scope, $http, $window, config) {
  $scope.model = {};
  $scope.data = config.data;
  $scope.feedback = {};
  // FIXME: temporary code to be removed after feedback improvements.
  //      : also remove the id fom the form in create.tpl.
  $scope.feedbackTarget = $('#createIdentityFeedbackTarget');
  $scope.loading = false;
  $scope.identity = {
    '@context': config.data.contextUrl,
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
    Promise.resolve($http.post('/join', $scope.identity))
      .then(function(response) {
        // redirect to new dashboard
        $window.location = response.data.id + '/dashboard';
      }).catch(function(err) {
        $scope.loading = false;
        $scope.feedback.error = err;
        $scope.$apply();
      });
  };
}

});
