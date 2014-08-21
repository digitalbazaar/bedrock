/*!
 * A polyfill for placeholder.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'A',
    link: function(scope, element) {
      if(element.placeholder) {
        element.placeholder();
      }
    }
  };
}

// polyfills "placeholder" attribute -- intentionally no "br-" prefix
return {placeholder: factory};

});
