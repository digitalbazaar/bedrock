/*!
 * Key Settings.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$scope', 'svcKey'];
return {KeySettingsCtrl: deps.concat(factory)};

function factory($scope, svcKey) {
  $scope.state = svcKey.state;
  $scope.keys = svcKey.keys;
  $scope.modals = {
    showEditKey: false,
    showRevokeKeyAlert: false,
    key: null
  };

  $scope.editKey = function(key) {
    $scope.modals.showEditKey = true;
    $scope.modals.key = key;
  };
  $scope.revokeKey = function(key) {
    $scope.modals.showRevokeKeyAlert = true;
    $scope.modals.key = key;
  };
  $scope.confirmRevokeKey = function(err, result) {
    if(!err && result === 'ok') {
      svcKey.revoke($scope.modals.key.id);
    }
    $scope.modals.key = null;
  };

  function refresh(force) {
    var opts = {force: !!force};
    svcKey.collection.getAll(opts);
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
