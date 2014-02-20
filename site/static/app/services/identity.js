/*!
 * Identity Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

'use strict';

var deps = ['$http', '$rootScope'];
return {svcIdentity: deps.concat(factory)};

function factory($http, $rootScope) {
  var service = {};

  var data = window.data || {};
  var session = data.session || {auth: false};
  service.identity = session.identity || null;
  service.identityMap = session.identities || {};
  service.identities = [];
  angular.forEach(service.identityMap, function(identity) {
    service.identities.push(identity);
  });
  service.state = {
    loading: false
  };

  // add a new identity
  service.add = function(identity) {
    return new Promise(function(resolve, reject) {
      service.state.loading = true;
      var promise = Promise.cast($http.post('/i', identity));
      promise.then(function(response) {
        service.identityMap[identity.id] = identity;
        service.identities.push(identity);
        service.state.loading = false;
        resolve(response.data);
        $rootScope.$apply();
      }).catch(function(err) {
        service.state.loading = false;
        reject(err);
        $rootScope.$apply();
      });
    });
  };

  // update identity preferences
  service.updatePreferences = function(
    identityId, preferences, nonce, callback) {
    if(typeof nonce === 'function') {
      callback = nonce;
      nonce = undefined;
    }
    callback = callback || angular.noop;
    service.state.loading = true;
    bedrock.identities.preferences.update({
      identity: identityId,
      preferences: preferences,
      success: function() {
        // get identity preferences and post to callback
        bedrock.identities.preferences.get({
          identity: identityId,
          responseNonce: nonce,
          success: function(prefs) {
            service.state.loading = false;
            // update preferences
            service.identity.preferences = prefs;
            callback(null, prefs);
            $rootScope.$apply();
          },
          error: function(err) {
            service.state.loading = false;
            callback(err);
            $rootScope.$apply();
          }
        });
      },
      error: function(err) {
        service.state.loading = false;
        callback(err);
        $rootScope.$apply();
      }
    });
  };

  return service;
}

});
