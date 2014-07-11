/*!
 * Focus Toggle directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($parse) {
  return function(scope, element, attrs) {
    var get = $parse(attrs.focusToggle);
    var set = get.assign || angular.noop;
    element.focus(function() {
      scope.$apply(function() {
        set(scope, true);
      });
    });
    element.blur(function() {
      scope.$apply(function() {
        set(scope, false);
      });
    });
  };
}

return {focusToggle: factory};

});
