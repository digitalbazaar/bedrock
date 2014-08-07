/*!
 * Alert module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './add-alert-directive',
  './alert-service',
  './alerts-directive'
], function(
  angular,
  addAlertDirective,
  alertService,
  alertsDirective) {

'use strict';

var module = angular.module('app.alert', []);

module.directive(addAlertDirective);
module.service(alertService);
module.directive(alertsDirective);

return module.name;

});
