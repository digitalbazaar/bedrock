/*!
 * Mouseover Toggle directive.
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
    var get = $parse(attrs.mouseoverToggle);
    var set = get.assign || angular.noop;
    element.mouseenter(function() {
      scope.$apply(function() {
        set(scope, true);
      });
    });
    element.mouseleave(function() {
      scope.$apply(function() {
        set(scope, false);
      });
    });
  };
}

return {mouseoverToggle: factory};

});
