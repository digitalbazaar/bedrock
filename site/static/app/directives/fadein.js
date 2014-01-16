/*!
 * Fade In directive.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$parse'];
return {fadein: deps.concat(factory)};

function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.fadein, function(value) {
        if(value) {
          element.fadeIn(function() {
            var fn = $parse(attrs.fadeinCallback) || angular.noop;
            scope.$apply(function() {
              fn(scope);
            });
          });
        }
      });
    }
  };
}

});
