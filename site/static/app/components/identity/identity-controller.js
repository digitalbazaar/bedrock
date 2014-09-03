/*!
 * Identity Details.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 * @author David I. Lehn
 * @author Dave Longley
 */
define(['jsonld'], function(jsonld) {

'use strict';

/* @ngInject */
function factory($scope, brAlertService, brIdentityService, brRefreshService) {
  var self = this;

  self.modals = {};
  self.state = {
    identities: brIdentityService.state
  };
  self.identity = undefined;

  brRefreshService.register($scope, function(force) {
    var opts = {force: !!force};
    brIdentityService.collection.getCurrent(opts).then(function(identity) {
      // ensure an array of zero or more publicKeys
      identity.publicKey = jsonld.getValues(identity, 'publicKey');
      self.identity = identity;
      $scope.$apply();
    }).catch(function(err) {
      brAlertService.add('error', err);
      self.identity = null;
      $scope.$apply();
    });
  })();
}

return {IdentityController: factory};

});
