/*!
 * Fade Out directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.fadeout, function(value) {
        if(value) {
          element.fadeOut(function() {
            var fn = $parse(attrs.fadeoutCallback) || angular.noop;
            scope.$apply(function() {
              fn(scope);
            });
          });
        }
      });
    }
  };
}

return {fadeout: factory};

});
