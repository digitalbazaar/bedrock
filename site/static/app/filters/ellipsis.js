/*!
 * Ellipsis filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {ellipsis: deps.concat(factory)};

function factory() {
  return function(value, length) {
    length = Math.max(3, length);
    length -= 3;
    if(value.length > length) {
      value = value.substr(0, length) + '...';
    }
    return value;
  };
}

});
