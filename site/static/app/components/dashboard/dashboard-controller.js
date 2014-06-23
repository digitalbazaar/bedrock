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

var deps = ['$scope', 'IdentityService'];
return {DashboardController: deps.concat(factory)};

function factory($scope, IdentityService) {
  var self = this;
  self.identity = IdentityService.identity;
  self.state = {};
  self.modals = {};

  function refresh(force) {
    var opts = {force: !!force};
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
