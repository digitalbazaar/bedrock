/*!
 * Navbar.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$scope', '$rootScope', 'config'];
return {NavbarCtrl: deps.concat(factory)};

function factory($scope, $rootScope, config) {
  var model = $scope.model = {};
  model.session = config.data.session;
  model.navbar = config.site.navbar;

  $scope.refreshData = function() {
    $rootScope.$broadcast('refreshData');
    $scope.setVisible(false);
  };

  $rootScope.$on('showLoginModal', function() {
    model.showLogin = true;
  });
}

});
