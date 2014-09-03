/*!
 * Settings Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($scope, brIdentityService, config) {
  var self = this;
  self.identity = brIdentityService.identity;
  self.panes = config.settings.panes;

  // FIXME: use brRefreshService
  function refresh(force) {
    var opts = {force: !!force};
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

return {SettingsController: factory};

});
