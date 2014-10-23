/*!
 * Components module.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './example/example',
  'bedrock/app/components/dashboard/dashboard',
  'bedrock/app/components/duplicate-checker/duplicate-checker',
  'bedrock/app/components/fade/fade',
  'bedrock/app/components/feedback/feedback',
  'bedrock/app/components/identity/identity',
  'bedrock/app/components/key/key',
  'bedrock/app/components/login/login',
  'bedrock/app/components/modal/modal',
  'bedrock/app/components/navbar/navbar',
  'bedrock/app/components/passcode/passcode',
  'bedrock/app/components/placeholder/placeholder',
  'bedrock/app/components/remote-file-selector/remote-file-selector',
  'bedrock/app/components/selector/selector',
  'bedrock/app/components/settings/settings',
  'bedrock/app/components/slug/slug',
  'bedrock/app/components/submit-form/submit-form',
  'bedrock/app/components/tabs/tabs',
  'bedrock/app/components/util/util'
], function(angular) {

'use strict';

angular.module('app.components', Array.prototype.slice.call(arguments, 1));

});
