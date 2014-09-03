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
function factory($scope, brAlertService, brIdentityService, config) {
  var self = this;
  self.email = config.data.session ? config.data.session.identity.email : '';
  self.sysPasscode = config.data.sysPasscode || '';
  self.sysPasswordNew = '';
  self.loading = false;

  self.sendReset = function() {
    // request a passcode
    brAlertService.clearFeedback();
    self.loading = true;
    brIdentityService.sendPasscode({
      sysIdentifier: self.email,
      usage: 'reset'
    }).then(function() {
      brAlertService.add('success', {
        message:
          'An email has been sent to you with password reset instructions.'
      });
    }).catch(function(err) {
      brAlertService.add('error', err);
    }).then(function() {
      self.loading = false;
      $scope.$apply();
    });
  };

  self.updatePassword = function() {
    // request a password reset using the given passcode
    brAlertService.clearFeedback();
    self.loading = true;
    brIdentityService.updatePassword({
      sysIdentifier: self.email,
      sysPasscode: self.sysPasscode,
      sysPasswordNew: self.sysPasswordNew
    }).then(function() {
      brAlertService.add('success', {
        message: 'Your password has been updated successfully.'
      });
    }).catch(function(err) {
      brAlertService.add('error', err);
    }).then(function() {
      self.loading = false;
      $scope.$apply();
    });
  };
}

return {PasscodeController: factory};

});
