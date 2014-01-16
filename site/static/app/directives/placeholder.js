/*!
 * A polyfill for placeholder.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {placeholder: deps.concat(factory)};

function factory() {
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ngModel) {
      if(element.placeholder) {
        element.placeholder();
      }
    }
  };
}

});
