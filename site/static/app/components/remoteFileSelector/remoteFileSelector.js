/*!
 * Remote File Selector module.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([
  'angular',
  './modalSelectRemoteFile.directive'
], function(angular, modalSelectRemoteFile) {

'use strict';

var module = angular.module('app.remoteFileSelector', []);

module.directive(modalSelectRemoteFile);

});
