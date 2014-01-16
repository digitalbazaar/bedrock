/*!
 * Embedded string filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {embeddedString: deps.concat(factory)};

function factory() {
  return function(value) {
    if(value === undefined || value === null) {
      return '';
    }
    return value.replace(/\r/g, '\\r').replace(/\n/g, '\\n');
  };
}

});
