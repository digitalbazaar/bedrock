/*!
 * Mask filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {mask: deps.concat(factory)};

function factory() {
  return function(value, length) {
    if(length === undefined) {
      length = 5;
    }
    value = value.substr(value.length - 4);
    return new Array(length - value.length + 1).join('*') + value;
  };
}

});
