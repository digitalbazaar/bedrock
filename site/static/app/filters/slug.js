/*!
 * Slug filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {slug: deps.concat(factory)};

function factory() {
  return function(input) {
    // replace spaces with dashes, make lower case and URI encode
    if(input === undefined || input.length === 0) {
      input = '';
    }
    return encodeURIComponent(
      input.replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').toLowerCase());
  };
}

});
