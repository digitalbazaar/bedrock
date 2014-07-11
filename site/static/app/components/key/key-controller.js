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
function factory($scope, ModelService, KeyService, RefreshService) {
  var self = this;
  self.key = {};

  RefreshService.register($scope, function(force) {
    var opts = {force: !!force};
    KeyService.collection.getCurrent(opts)
      .then(function(key) {
        ModelService.replace(self.key, key);
        $scope.$apply();
      });
  })();
}

return {KeyController: factory};

});
