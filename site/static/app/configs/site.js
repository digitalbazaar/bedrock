/*!
 * Site config.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author David I. Lehn
 */
define([], function() {

'use strict';

return {
  site: {
    navbar: {
      nav: [
        {
          slug: 'dashboard',
          icon: 'icon-dashboard',
          label: 'Dashboard',
          pageTitle: 'Dashboard'
        },
        {
          slug: 'settings',
          icon: 'icon-wrench',
          label: 'Settings',
          pageTitle: 'Settings'
        }
      ]
    }
  }
};

});
