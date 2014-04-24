/*!
 * Example controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['$scope'];
return {ExampleCtrl: deps.concat(factory)};

function factory($scope) {
  var model = $scope.model = {};
  var data = window.data || {};

  console.log('ExampleCtrl initialized...');
}

});
