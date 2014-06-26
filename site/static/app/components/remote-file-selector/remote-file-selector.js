/*!
 * Remote File Selector module.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([
  'angular',
  './remote-file-selector-modal-directive'
], function(angular, remoteFileSelectorModal) {

'use strict';

var module = angular.module('app.remoteFileSelector', []);

module.directive(remoteFileSelectorModal);

return module.name;

});
