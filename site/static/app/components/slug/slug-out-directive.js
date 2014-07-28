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
      var namespace = 'slugOutDirective';
      element.on(
        'propertychange' + namespace +
        ' change' + namespace +
        ' input' + namespace +
        ' keyup' + namespace +
        ' paste' + namespace, function() {
        set(scope, slug(element.val()));
        scope.$apply();
      });
      scope.$on('$destroy', function() {
        element.off(namespace);
      });
      element.on('$destroy' + namespace, function() {
        element.off(namespace);
      });
    }
  };
}

return {slugOut: factory};

});
