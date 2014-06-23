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
return {NavbarController: deps.concat(factory)};

function factory($scope, $rootScope, config) {
  var self = this;
  self.session = config.data.session;
  self.navbar = config.site.navbar;

  $scope.refreshData = function() {
    $rootScope.$broadcast('refreshData');
    $scope.setVisible(false);
  };

  $rootScope.$on('showLoginModal', function() {
    self.showLogin = true;
  });
}

});
