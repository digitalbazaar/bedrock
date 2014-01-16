/*!
 * Slug Out directive.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$filter', '$parse'];
return {slugOut: deps.concat(factory)};

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

});
