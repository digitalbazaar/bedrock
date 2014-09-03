/*!
 * Key Details.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 * @author David I. Lehn
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($scope, brAlertService, brKeyService, brRefreshService) {
  var self = this;

  self.modals = {};
  self.state = {
    keys: brKeyService.state
  };
  self.key = undefined;

  brRefreshService.register($scope, function(force) {
    var opts = {force: !!force};
    brAlertService.clear();
    brKeyService.collection.getCurrent(opts).then(function(key) {
      self.key = key;
      $scope.$apply();
    }).catch(function(err) {
      brAlertService.add('error', err);
      self.key = null;
      $scope.$apply();
    });
  })();
}

return {KeyController: factory};

});
