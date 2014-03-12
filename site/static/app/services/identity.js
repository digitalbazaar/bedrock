/*!
 * Identity Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['config', '$http', '$rootScope'];
return {svcIdentity: deps.concat(factory)};

function factory(config, $http, $rootScope) {
  var service = {};

  var session = config.data.session || {auth: false};
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

  return service;
}

});
