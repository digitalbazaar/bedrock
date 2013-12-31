/*!
 * Mouseover Toggle directive.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$parse'];
return {mouseoverToggle: deps.concat(factory)};

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

});
