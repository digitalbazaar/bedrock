/*!
 * encodeURIComponent filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {encodeURIComponent: deps.concat(factory)};

function factory() {
  return function(value) {
    if(value === undefined || value === null) {
      return '';
    }
    return encodeURIComponent(value);
  };
}

});
