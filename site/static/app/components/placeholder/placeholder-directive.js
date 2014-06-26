/*!
 * A polyfill for placeholder.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = [];
return {placeholder: deps.concat(factory)};

function factory() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element) {
      if(element.placeholder) {
        element.placeholder();
      }
    }
  };
}

});
