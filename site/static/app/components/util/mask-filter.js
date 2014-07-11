/*!
 * Mask filter.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return function(value, length) {
    if(length === undefined) {
      length = 5;
    }
    value = value.substr(value.length - 4);
    return new Array(length - value.length + 1).join('*') + value;
  };
}

return {mask: factory};

});
