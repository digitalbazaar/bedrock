/*!
 * Identity Settings.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['$scope', 'IdentityService'];
return {IdentitySettingsController: deps.concat(factory)};

function factory($scope, IdentityService) {
  var self = this;
  self.state = IdentityService.state;

  function refresh(force) {
    var opts = {force: !!force};
    //IdentityService.get(opts);
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
