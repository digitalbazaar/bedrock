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
function factory($scope, AlertService, KeyService, RefreshService) {
  var self = this;

  self.modals = {};
  self.state = {
    keys: KeyService.state
  };
  self.key = undefined;

  RefreshService.register($scope, function(force) {
    var opts = {force: !!force};
    AlertService.clear();
    KeyService.collection.getCurrent(opts).then(function(key) {
      self.key = key;
      $scope.$apply();
    }).catch(function(err) {
      AlertService.add('error', err);
      self.key = null;
      $scope.$apply();
    });
  })();
}

return {KeyController: factory};

});
