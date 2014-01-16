/*!
 * Focus Toggle directive.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$parse'];
return {focusToggle: deps.concat(factory)};

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

});
