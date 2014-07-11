/*!
 * encodeURIComponent filter.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return function(value) {
    if(value === undefined || value === null) {
      return '';
    }
    return encodeURIComponent(value);
  };
}

return {encodeURIComponent: factory};

});
