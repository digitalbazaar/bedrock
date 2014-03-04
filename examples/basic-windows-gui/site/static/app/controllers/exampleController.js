/*!
 * Example controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$scope'];
return {
  controller: {ExampleCtrl: deps.concat(factory)}
};

function factory($scope, $http) {
  var model = $scope.model = {};
  var data = window.data || {};
  
  console.log('ExampleCtrl initialized...');
}

});
