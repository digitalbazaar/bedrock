/*!
 * Keys Controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['$scope', '$routeParams', 'config', 'svcIdentity', 'svcKey'];
return {KeysCtrl: deps.concat(factory)};

function factory($scope, $routeParams, config, svcIdentity, svcKey) {
  var model = $scope.model = {};
  $scope.state = svcKey.state;
  $scope.keys = svcKey.keys;
  $scope.modals = {
    showGenerateKeyPair: false,
    showAddKey: false,
    showEditKey: false,
    showRevokeKeyAlert: false,
    key: null
  };

  if($routeParams.service === 'add-key') {
    $scope.modals.showAddKey = true;
  }

  $scope.editKey = function(key) {
    $scope.modals.showEditKey = true;
    $scope.modals.key = key;
  };
  $scope.setDefaultSigningKeyId = function(keyId) {
    var update = {
      '@context': config.data.contextUrl,
      id: config.data.session.identity.id,
      sysSigningKey: keyId
    };

    svcIdentity.collection.update(update)
      .catch(function(err) {
        // FIXME: show error feedback
        if(err) {
          console.error('setDefaultSigningKeyId error:', err);
        }
      });
  };
  $scope.revokeKey = function(key) {
    $scope.modals.showRevokeKeyAlert = true;
    $scope.modals.key = key;
  };
  $scope.confirmRevokeKey = function(err, result) {
    if(!err && result === 'ok') {
      svcKey.collection.revoke($scope.modals.key.id);
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
