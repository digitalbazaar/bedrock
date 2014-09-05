/*!
 * Identity Settings Routes.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

return [{
  path: window.data.identityBasePath + '/:identity/settings',
  options: {
    title: 'Settings',
    session: 'required',
    templateUrl: '/app/components/settings/settings.html'
  }
}];

});
