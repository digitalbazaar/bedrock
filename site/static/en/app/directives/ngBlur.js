/*!
 * Blur directive.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = ['$parse'];
return {ngBlur: deps.concat(factory)};

function factory($parse) {
  // FIXME: polyfill until implemented in core AngularJS
  return function(scope, element, attrs) {
    var fn = $parse(attrs.ngBlur);
    element.blur(function(event) {
      scope.$apply(function() {
        fn(scope, {$event: event});
      });
    });
  };
}

});
