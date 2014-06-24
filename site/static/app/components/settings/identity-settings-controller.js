/*!
 * Identity Settings.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['IdentityService'];
return {IdentitySettingsController: deps.concat(factory)};

function factory(IdentityService) {
  var self = this;
  self.state = IdentityService.state;
}

});
