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

var deps = ['$scope', 'config', 'svcModel', 'svcKey'];
return {
  controller: {KeyCtrl: deps.concat(factory)},
  routes: [{
    path:
      window.data.identityBasePath +
      '/:identity/keys/:keyId',
    options: {
      title: 'Key',
      templateUrl: '/app/components/key/key.html'
    }
  }]
};

function factory($scope, config, svcModel, svcKey) {
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
