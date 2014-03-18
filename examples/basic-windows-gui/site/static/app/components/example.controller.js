/*!
 * Example controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['$scope', 'config', 'http'];
return {
  controller: {ExampleCtrl: deps.concat(factory)}
};

function factory($scope, config, $http) {
  console.log('ExampleCtrl initialized...');
}

});
