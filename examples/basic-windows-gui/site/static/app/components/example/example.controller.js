/*!
 * Example controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

var deps = ['config', '$http'];
return {ExampleCtrl: deps.concat(factory)};

function factory(config, $http) {
  this.name = config.data.siteTitle;
  this.bedrock = 'Bedrock';

  console.log('ExampleCtrl initialized...');
}

});
