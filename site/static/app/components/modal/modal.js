/*!
 * Modal module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './alert-modal-directive',
  './modal-directive'
], function(angular, alertModal, modal) {

'use strict';

var module = angular.module('app.modal', []);

module.directive(alertModal);
module.directive(modal);

return module.name;

});
