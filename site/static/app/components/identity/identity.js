/*!
 * Identity module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './createIdentity.controller',
  './identity.service',
  './identitySelector.directive',
  './modalAddIdentity.directive'
], function(
  angular, createIdentity, service, identitySelector, modalAddIdentity) {

'use strict';

var module = angular.module('app.identity', []);

module.controller(createIdentity);
module.service(service);
module.directive(identitySelector);
module.directive(modalAddIdentity);

});
