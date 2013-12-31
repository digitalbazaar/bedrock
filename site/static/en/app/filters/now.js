/*!
 * Now date filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = ['$filter'];
return {now: deps.concat(factory)};

function factory($filter) {
  return function(value, format) {
    return $filter('date')(new Date(), format);
  };
}

});
