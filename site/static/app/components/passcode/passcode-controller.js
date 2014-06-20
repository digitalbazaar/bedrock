/*!
 * Password Reset Support.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['$scope', 'config', '$http'];
return {PasscodeCtrl: deps.concat(factory)};

function factory($scope, config, $http) {
  $scope.model = {};
  $scope.email = config.data.session ? config.data.session.identity.email : '';
  $scope.sysPasscode = config.data.sysPasscode || '';
  $scope.sysPasswordNew = '';
  $scope.feedback = {
    email: {},
    password: {}
  };
  $scope.emailFeedbackTarget = $('#emailFeedbackTarget');
  $scope.passwordFeedbackTarget = $('#passwordFeedbackTarget');

  $scope.sendReset = function() {
    // request a passcode
    resetFeedback();
    Promise.resolve($http.post('/session/passcode?usage=reset', {
      sysIdentifier: $scope.email
    })).then(function() {
      $scope.feedback.email.success = {
        message:
          'An email has been sent to you with password reset instructions.'
      };
      $scope.$apply();
    }).catch(function(err) {
      $scope.feedback.email.error = err;
      $scope.$apply();
    });
  };

  $scope.updatePassword = function() {
    // request a password reset using the given passcode
    resetFeedback();
    Promise.resolve($http.post('/session/password/reset', {
      sysIdentifier: $scope.email,
      sysPasscode: $scope.sysPasscode,
      sysPasswordNew: $scope.sysPasswordNew
    })).then(function() {
      $scope.feedback.password.success = {
        message: 'Your password has been updated successfully.'
      };
      $scope.$apply();
    }).catch(function(err) {
      $scope.feedback.password.error = err;
      $scope.$apply();
    });
  };

  function resetFeedback() {
    $scope.feedback.email = {};
    $scope.feedback.password = {};
  }
}

});
