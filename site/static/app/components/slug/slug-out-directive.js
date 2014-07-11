/*!
 * Slug Out directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($filter, $parse) {
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var slug = $filter('slug');
      var set = $parse(attrs.slugOut).assign || angular.noop;
      element.on('propertychange change input keyup paste', function(e) {
        scope.$apply(function() {
          set(scope, slug(element.val()));
        });
      });
    }
  };
}

return {slugOut: factory};

});
