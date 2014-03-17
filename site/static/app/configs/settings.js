/*!
 * Settings config.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author David I. Lehn
 */
define([], function() {

'use strict';

return {
  settings: {
    panes: [
      {
        templateUrl: '/app/components/settings/identity.html'
      },
      {
        templateUrl: '/app/components/settings/keys.html'
      }
    ]
  }
};

});
