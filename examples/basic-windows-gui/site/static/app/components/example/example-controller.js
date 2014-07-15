/*!
 * Example controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

function factory(config, $http) {
  this.name = config.data.siteTitle;
  this.bedrock = 'Bedrock';
  console.log('ExampleCtrl initialized...');
}

/* @ngInject */
return {ExampleController: factory};

});
