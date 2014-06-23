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

var deps = ['$scope', '$http', 'config'];
return {PasscodeController: deps.concat(factory)};

function factory($scope, $http, config) {
  var self = this;
  self.email = config.data.session ? config.data.session.identity.email : '';
  self.sysPasscode = config.data.sysPasscode || '';
  self.sysPasswordNew = '';
  self.feedback = {
    email: {},
    password: {}
  };
  self.emailFeedbackTarget = $('#emailFeedbackTarget');
  self.passwordFeedbackTarget = $('#passwordFeedbackTarget');

  self.sendReset = function() {
    // request a passcode
    resetFeedback();
    Promise.resolve($http.post('/session/passcode?usage=reset', {
      sysIdentifier: self.email
    })).then(function() {
      self.feedback.email.success = {
        message:
          'An email has been sent to you with password reset instructions.'
      };
      $scope.$apply();
    }).catch(function(err) {
      self.feedback.email.error = err;
      $scope.$apply();
    });
  };

  self.updatePassword = function() {
    // request a password reset using the given passcode
    resetFeedback();
    Promise.resolve($http.post('/session/password/reset', {
      sysIdentifier: self.email,
      sysPasscode: self.sysPasscode,
      sysPasswordNew: self.sysPasswordNew
    })).then(function() {
      self.feedback.password.success = {
        message: 'Your password has been updated successfully.'
      };
      $scope.$apply();
    }).catch(function(err) {
      self.feedback.password.error = err;
      $scope.$apply();
    });
  };

  function resetFeedback() {
    self.feedback.email = {};
    self.feedback.password = {};
  }
}

});
