/*!
 * Identity Routes.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 * @author David I. Lehn
 * @author Dave Longley
 */
define([], function() {

'use strict';

var base = window.data.identityBasePath;
return [{
  path: base,
  options: {
    title: 'Identity Credentials',
    templateUrl: '/app/components/identity/identity-credentials.html'
  }
}, {
  path: base + '/:identity',
  options: {
    title: 'Identity',
    templateUrl: '/app/components/identity/identity.html'
  }
}];

});
