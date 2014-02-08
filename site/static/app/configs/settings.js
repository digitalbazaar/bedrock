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
        templateUrl: '/app/templates/settings/profile.html'
      },
      {
        templateUrl: 'app/templates/settings/keys.html'
      }
    ]
  }
};

});
