/*!
 * Identity Dashboard.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['$scope', 'config', 'svcIdentity'];
return {
  controller: {DashboardCtrl: deps.concat(factory)},
  routes: [{
    path: window.data.identityBasePath + '/:identity/dashboard',
    options: {
      title: 'Dashboard',
      templateUrl: '/app/components/dashboard/dashboard.html'
    }
  }]
};

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
