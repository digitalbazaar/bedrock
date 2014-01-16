/*!
 * Math ceil filter.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = [];
return {ceil: deps.concat(factory)};

function factory() {
  // Note: does not deal w/values w/leading zeros
  return function(value, digits) {
    value = (!value) ? '0' : value.toString();
    if(digits === undefined) {
      digits = 2;
    }
    var dec = value.indexOf('.');
    if(dec === -1) {
      dec = value.length;
      value += '.';
    }
    if(dec === 0) {
      value = '0' + value;
    }
    var length = dec + digits + 1;
    var overflow = parseFloat(value.substr(length));
    value = value.substr(0, length);
    if(!isNaN(overflow) && overflow > 0) {
      value = (parseFloat(value) +
        parseFloat('.' + new Array(digits).join('0') + '1')).toFixed(digits);
    }
    return value + new Array(length - value.length + 1).join('0');
  };
}

});
