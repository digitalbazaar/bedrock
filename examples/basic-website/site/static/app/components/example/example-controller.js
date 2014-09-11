/*!
 * Example controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($scope, config) {
  var model = $scope.model = {};
  var data = config.data;
  console.log('ExampleCtrl initialized...');
}

return {ExampleController: factory};

});
