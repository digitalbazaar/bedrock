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

var deps = ['$scope', 'ModelService', 'KeyService'];
return {KeyController: deps.concat(factory)};

function factory($scope, ModelService, KeyService) {
  var self = this;
  self.key = {};

  function refresh(force) {
    var opts = {force: !!force};
    KeyService.collection.getCurrent(opts)
      .then(function(key) {
        ModelService.replace(self.key, key);
        $scope.$apply();
      });
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
