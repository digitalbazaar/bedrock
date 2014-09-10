/*!
 * Identity Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(
  $http, $rootScope, $routeParams, brRefreshService, brResourceService,
  config) {
  var service = {};

  service.collection = new brResourceService.Collection({
    url: config.data.identityBaseUri
  });

  var session = config.data.session || {auth: false};
  service.identity = session.identity || null;
  service.state = service.collection.state;

  // add session identities to identity storage and save result references
  if(service.identity) {
    service.collection.addToStorage(service.identity).then(function(identity) {
      service.identity = identity;
    });
  }

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
      var err = new Error(
        'You must be logged in to verify an email address.');
      err.type = 'bedrock.website.PermissionDenied';
      return Promise.reject(err);
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

  /**
   * Helper to generate identity URLs.
   *
   * @param method method to use to generate identity id
   *          'current': use current logged in id
   *          'route': base id on current route
   *          'shortId': base id on shortId param
   *          'id': use passed identity
   *        identityShortId short id to use for 'shortId' method (optional)
   *        id full identity id to use for 'id' method (optional)
   */
  service.generateUrl = function(options) {
    var url = '';
    if(options.identityMethod == 'current' && service.identity) {
      return service.identity.id;
    } else if(options.identityMethod == 'route') {
      return config.data.identityBaseUri + '/' + $routeParams.identity;
    } else if(options.identityMethod == 'shortId' && options.identityShortid) {
      return config.data.identityBaseUri + '/' + options.identityShortid;
    } else if(options.identityMethod == 'id' && options.identityId) {
      return identityId;
    } else {
      throw Error('Identity URL generation error.');
    }
  };

  // register for system-wide refreshes
  brRefreshService.register(function() {
    if(service.identity) {
      service.collection.get(service.identity.id);
    }
  });

  // expose service to scope
  $rootScope.app.services.identity = service;

  return service;
}

return {brIdentityService: factory};

});
