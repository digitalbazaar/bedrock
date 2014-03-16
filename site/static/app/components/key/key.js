/*!
 * Key module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'key.controller',
  'key.service',
  'modalEditKey.directive'
], function(angular, controller, service, modalEditKey) {

'use strict';

var module = angular.module('app.key', []);

module.controller(controller);
module.service(service);
module.directive(modalEditKey);

});
