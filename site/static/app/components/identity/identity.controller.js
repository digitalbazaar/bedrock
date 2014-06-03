/*!
 * Identity Details.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 * @author David I. Lehn
 * @author Dave Longley
 */
define(['jsonld'], function(jsonld) {

'use strict';

var deps = ['$scope', 'svcModel', 'svcIdentity'];
return {IdentityCtrl: deps.concat(factory)};

function factory($scope, svcModel, svcIdentity) {
  var model = $scope.model = {};
  $scope.state = svcIdentity.state;
  $scope.modals = {};

  model.identity = {};

  function refresh(force) {
    var opts = {force: !!force};
    svcIdentity.collection.getCurrent(opts)
      .then(function(identity) {
        // ensure an array of zero or more publicKeys
        identity.publicKey = jsonld.getValues(identity, 'publicKey');
        svcModel.replace(model.identity, identity);
        $scope.$apply();
      });
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
