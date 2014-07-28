/*!
 * Slug In directive.
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
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      var slug = $filter('slug');
      var set = $parse(attrs.ngModel).assign || angular.noop;

      var namespace = '.slugInDirective';
      scope.$on('$destroy', function() {
        element.off(namespace);
      });
      element.on('$destroy' + namespace, function() {
        element.off(namespace);
      });

      // replace with previous initial value on blur if value is blank
      var last = '';
      element.on('focus' + namespace, function() {
        last = ngModel.$modelValue;
      });
      element.on('blur' + namespace, function() {
        if(ngModel.$modelValue === '') {
          scope.$apply(function() {
            set(scope, last);
          });
        }
      });

      // ensure view is updated after any input event
      element.on(
        'propertychange' + namespace +
        ' change' + namespace +
        ' input' + namespace +
        ' keyup' + namespace +
        ' paste' + namespace, function() {
        if(ngModel.$viewValue !== element.val()) {
          ngModel.$setViewValue(element.val());
        }
      });

      // always display model value (override view value)
      ngModel.$render = function() {
        element.val(ngModel.$modelValue);
      };

      // convert view value into slug
      ngModel.$parsers.push(function(v) {
        var parsed = slug(v);
        // force view to match model
        if(parsed !== ngModel.$viewValue) {
          ngModel.$setViewValue(parsed);
          ngModel.$render();
        }
        return parsed;
      });
    }
  };
}

return {slugIn: factory};

});
