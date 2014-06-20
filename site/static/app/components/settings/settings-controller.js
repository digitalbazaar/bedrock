/*!
 * Identity Settings Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['$scope', 'config', 'svcIdentity'];
return {SettingsCtrl: deps.concat(factory)};

function factory($scope, config, svcIdentity) {
  // TODO: use model instead of scope directly
  var model = $scope.model = {};
  $scope.identity = svcIdentity.identity;
  $scope.state = {};
  $scope.modals = {};

  $scope.panes = config.settings.panes;

  function refresh(force) {
    var opts = {force: !!force};
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
