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

/* @ngInject */
function factory($scope, AlertService, IdentityService, config) {
  var self = this;
  self.email = config.data.session ? config.data.session.identity.email : '';
  self.sysPasscode = config.data.sysPasscode || '';
  self.sysPasswordNew = '';
  self.loading = false;

  self.sendReset = function() {
    // request a passcode
    AlertService.clearFeedback();
    self.loading = true;
    IdentityService.sendPasscode({
      sysIdentifier: self.email,
      usage: 'reset'
    }).then(function() {
      AlertService.add('success', {
        message:
          'An email has been sent to you with password reset instructions.'
      });
    }).catch(function(err) {
      AlertService.add('error', err);
    }).then(function() {
      self.loading = false;
      $scope.$apply();
    });
  };

  self.updatePassword = function() {
    // request a password reset using the given passcode
    AlertService.clearFeedback();
    self.loading = true;
    IdentityService.updatePassword({
      sysIdentifier: self.email,
      sysPasscode: self.sysPasscode,
      sysPasswordNew: self.sysPasswordNew
    }).then(function() {
      AlertService.add('success', {
        message: 'Your password has been updated successfully.'
      });
    }).catch(function(err) {
      AlertService.add('error', err);
    }).then(function() {
      self.loading = false;
      $scope.$apply();
    });
  };
}

return {PasscodeController: factory};

});
