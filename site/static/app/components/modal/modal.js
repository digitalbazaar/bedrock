/*!
 * Modal module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './modal-service',
  './alert-modal-directive'
], function(angular, service, alertModal) {

'use strict';

var module = angular.module('app.modal', []);

module.service(service);
module.directive(alertModal);

return module.name;

});
