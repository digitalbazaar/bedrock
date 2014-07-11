/*!
 * Navbar.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($scope, $rootScope, RefreshService, IdentityService, config) {
  var self = this;
  self.session = config.data.session;
  self.navbar = config.site.navbar;
  self.identity = IdentityService.identity;

  self.refreshData = function() {
    RefreshService.refresh();
    $scope.setVisible(false);
  };

  $rootScope.$on('showLoginModal', function() {
    self.showLogin = true;
  });
}

return {NavbarController: factory};

});
