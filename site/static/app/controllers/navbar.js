/*!
 * Navbar.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['jquery'], function($) {

var deps = ['$scope', '$rootScope'];
return {NavbarCtrl: deps.concat(factory)};

function factory($scope, $rootScope) {
  $scope.model = {};
  $scope.session = window.data.session;

  $scope.refreshData = function() {
    $rootScope.$broadcast('refreshData');
  };
}

});
