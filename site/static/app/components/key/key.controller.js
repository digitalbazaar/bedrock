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

var deps = ['$scope', 'svcModel', 'svcKey'];
return {KeyCtrl: deps.concat(factory)};

function factory($scope, svcModel, svcKey) {
  var model = $scope.model = {};
  $scope.state = svcKey.state;
  $scope.modals = {};

  model.key = {};

  function refresh(force) {
    var opts = {force: !!force};
    svcKey.collection.getCurrent(opts)
      .then(function(key) {
        svcModel.replace(model.key, key);
        $scope.$apply();
      });
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
