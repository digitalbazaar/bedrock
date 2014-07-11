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

/* @ngInject */
function factory(IdentityService) {
  var self = this;
  self.identity = IdentityService.identity;
  self.state = {};
  self.modals = {};
}

return {DashboardController: factory};

});
