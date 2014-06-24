/*!
 * Identity Dashboard Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['IdentityService'];
return {DashboardController: deps.concat(factory)};

function factory(IdentityService) {
  var self = this;
  self.identity = IdentityService.identity;
  self.state = {};
  self.modals = {};
}

});
