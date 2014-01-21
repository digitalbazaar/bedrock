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

var deps = ['$scope'];
return {KeyCtrl: deps.concat(factory)};

function factory($scope) {
  $scope.model = {};
  var data = window.data || {};
  $scope.key = data.key;
}

});
