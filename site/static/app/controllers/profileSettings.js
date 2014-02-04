/*!
 * Profile Settings.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

var deps = ['$scope', 'svcIdentity'];
return {ProfileSettingsCtrl: deps.concat(factory)};

function factory($scope, svcIdentity) {
  $scope.state = svcIdentity.state;
  $scope.modals = {};

  function refresh(force) {
    var opts = {force: !!force};
    //svcIdentity.get(opts);
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
