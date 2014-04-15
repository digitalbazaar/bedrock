/*!
 * Identity Credentials UI.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$scope', 'config', 'svcIdentity'];
return {
  controller: {IdentityCredentialsCtrl: deps.concat(factory)},
  routes: [{
    path: window.data.identityBasePath,
    options: {
      title: 'Identity Credentials',
      templateUrl: '/app/components/identity/identity-credentials.html'
    }
  }]
};

function factory($scope, config, svcIdentity) {
  var model = $scope.model = {};
  model.identity = svcIdentity.identity;
  model.identityCredentials = config.data.identityCredentials;

  function refresh(force) {
    var opts = {force: !!force};
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
