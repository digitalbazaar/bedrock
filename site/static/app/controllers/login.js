/*!
 * Login Support.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

'use strict';

var deps = ['$scope', 'config', '$http'];
return {LoginCtrl: deps.concat(factory)};

function factory($scope, config, $http) {
  var model = $scope.model = {};
  $scope.multiple = false;
  $scope.loading = false;
  $scope.error = '';
  $scope.sysIdentifier = '';
  $scope.password = '';
  $scope.ref = config.data.ref;
  model.siteTitle = config.data.siteTitle;
  model.sessionExpired = config.data.sessionExpired || false;
  model.navbar = config.site.navbar;

  $scope.submit = function() {
    // do login
    $scope.error = '';
    $scope.loading = true;

    var data = {
      sysIdentifier: $scope.sysIdentifier,
      password: $scope.password
    };
    if($scope.ref) {
      data.ref = $scope.ref;
    }
    Promise.cast($http.post('/session/login', data))
      .then(function(response) {
      var data = response.data;
      // if a 'ref' is returned, login was successful
      if(data.ref) {
        // redirect to referral URL
        window.location = data.ref;
      }
      else {
        // show multiple identities
        $scope.multiple = true;
        $scope.email = data.email;
        $scope.choices = [];
        angular.forEach(data.identities, function(identity, identityId) {
          $scope.choices.push({id: identityId, label: identity.label});
        });
        $scope.sysIdentifier = $scope.choices[0].id;
        $scope.loading = false;
        $scope.$apply();
      }
    }).catch(function(err) {
      // FIXME: use directive to show feedback?
      if(err.type === 'bedrock.validation.ValidationError') {
        $scope.error = 'Please enter your email address and password.';
      }
      else {
        $scope.error = err.message;
      }
      $scope.loading = false;
      $scope.$apply();
    });
  };
}

});
