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
      private: [
        {
          slug: 'dashboard',
          icon: 'fa fa-dashboard',
          label: 'Dashboard',
          pageTitle: 'Dashboard'
        },
        {
          slug: 'settings',
          icon: 'fa fa-wrench',
          label: 'Settings',
          pageTitle: 'Settings'
        }
      ],
      public: []
    }
  }
};

});
