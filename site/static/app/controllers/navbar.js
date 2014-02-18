/*!
 * Navbar.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['jquery'], function($) {

'use strict';

var deps = ['$scope', '$rootScope', 'config'];
return {NavbarCtrl: deps.concat(factory)};

function factory($scope, $rootScope, config) {
  $scope.model = {};
  $scope.session = config.data.session;

  $scope.nav = config.site.navbar.nav;

  $scope.refreshData = function() {
    $rootScope.$broadcast('refreshData');
  };
}

});
