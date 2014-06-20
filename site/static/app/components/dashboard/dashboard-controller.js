/*!
 * Identity Dashboard Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['$scope', 'svcIdentity'];
return {DashboardCtrl: deps.concat(factory)};

function factory($scope, svcIdentity) {
  var model = $scope.model = {};
  $scope.identity = svcIdentity.identity;
  $scope.state = {};
  $scope.modals = {};

  function refresh(force) {
    var opts = {force: !!force};
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
