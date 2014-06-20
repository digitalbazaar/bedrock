/*!
 * Key Routes.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 * @author David I. Lehn
 * @author Dave Longley
 */
define([], function() {

'use strict';

var base = window.data.identityBasePath + '/:identity/keys';
return [{
  path: base,
  options: {
    title: 'Keys',
    templateUrl: '/app/components/key/keys.html'
  }
}, {
  path: base + '/:keyId',
  options: {
    title: 'Key',
    templateUrl: '/app/components/key/key.html'
  }
}];

});
