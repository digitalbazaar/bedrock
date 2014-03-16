/*!
 * Modal module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  'modal.service',
  'modalAlert.directive'
], function(angular, service, modalAlert) {

'use strict';

var module = angular.module('app.modal', []);

module.service(service);
module.directive(modalAlert);

});
