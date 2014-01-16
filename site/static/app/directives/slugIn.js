/*!
 * Slug In directive.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$filter', '$parse'];
return {slugIn: deps.concat(factory)};

function factory($filter, $parse) {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      var slug = $filter('slug');
      var set = $parse(attrs.ngModel).assign || angular.noop;

      // replace with previous initial value on blur if value is blank
      var last = '';
      element.bind('focus', function(e) {
        last = ngModel.$modelValue;
      });
      element.bind('blur', function(e) {
        if(ngModel.$modelValue === '') {
          scope.$apply(function() {
            set(scope, last);
          });
        }
      });

      // ensure view is updated after any input event
      element.bind('propertychange change input keyup paste', function(e) {
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

});
