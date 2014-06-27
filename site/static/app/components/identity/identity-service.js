/*!
 * Identity Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = [
  '$http', '$rootScope', 'RefreshService', 'ResourceService', 'config'];
return {IdentityService: deps.concat(factory)};

function factory($http, $rootScope, RefreshService, ResourceService, config) {
  var service = {};

  var session = config.data.session || {auth: false};
  service.identity = session.identity || null;
  service.identityMap = session.identities || {};
  service.identities = [];
  angular.forEach(service.identityMap, function(identity) {
    service.identities.push(identity);
  });

  service.collection = new ResourceService.Collection({
    url: config.data.identityBaseUri
  });
  // FIXME: update other code so common collection can be used
  //service.identities = service.collection.storage;
  service.state = service.collection.state;

  // add a new identity
  service.add = function(identity, options) {
    return service.collection.add(identity, options)
      .then(function(newIdentity) {
        // FIXME: use newIdentity?
        service.identityMap[identity.id] = identity;
        service.identities.push(identity);
      });
  };

  /**
   * Sends a passcode to the email address associated with the given
   * identifier to use to either verify an email address or reset a
   * password.
   *
   * @param options the options to use.
   *          sysIdentifier the identifier to use (ID, email, slug).
   *          usage 'verify' for a verify email passcode, 'reset' for a
   *            password-reset passcode.
   *
   * @return a Promise.
   */
  service.sendPasscode = function(options) {
    options = options || {};
    if(['verify', 'reset'].indexOf(options.usage) === -1) {
      return Promise.reject(new Error(
        'Invalid usage option: ' + options.usage));
    }
    return Promise.resolve($http.post('/session/passcode', {
      sysIdentifier: options.sysIdentifier
    }, {
      params: {usage: options.usage}
    }));
  };

  // verifies an email address for the current identity
  service.verifyEmail = function(passcode) {
    if(!service.identity) {
      $rootScope.$emit('showLoginModal');
      return Promise.reject(new Error(
        'You must be logged in to verify an email address.'));
    }
    return Promise.resolve($http.post(service.identity.id + '/email/verify', {
      sysPasscode: passcode
    }));
  };

  /**
   * Updates the password for an identity.
   *
   * @param options the options to use.
   *          sysIdentifier the identifier to use (ID, email, slug).
   *          sysPasscode the passcode required to update the password.
   *          sysPasswordNew the new password.
   *
   * @return a Promise.
   */
  service.updatePassword = function(options) {
    options = options || {};
    return Promise.resolve($http.post('/session/password/reset', {
      sysIdentifier: options.sysIdentifier,
      sysPasscode: options.sysPasscode,
      sysPasswordNew: options.sysPasswordNew
    }));
  };

  // register for system-wide refreshes
  RefreshService.register(function() {
    if(service.identity) {
      service.collection.get(service.identity.id);
    }
    // TODO: refresh all identities in the map?
  });

  // expose service to scope
  $rootScope.app.services.identity = service;

  return service;
}

});
