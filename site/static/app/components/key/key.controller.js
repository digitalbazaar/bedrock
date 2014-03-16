/*!
 * Key Details.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 * @author David I. Lehn
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$scope', 'config'];
return {KeyCtrl: deps.concat(factory)};

function factory($scope, config) {
  $scope.model = {};
  var data = config.data || {};
  $scope.key = data.key;
}

});
