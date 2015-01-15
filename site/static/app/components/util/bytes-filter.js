/*!
 * Bytes filter.
 *
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  // cribbed from: https://gist.github.com/thomseddon/3511330
  return function(bytes, precision) {
    bytes = parseFloat(bytes);

    if(bytes === 0) {
      return '0 bytes';
    }
    if(bytes === 1) {
      return '1 byte';
    }
    if(isNaN(bytes) || !isFinite(bytes)) {
      return '-';
    }
    if(typeof precision === 'undefined') {
      precision = 1;
    }

    var units = ['bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    var number = Math.floor(Math.log(bytes) / Math.log(1024));
    var value = (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision);

    return (value.match(/\.0*$/) ?
      value.substr(0, value.indexOf('.')) : value) +  ' ' + units[number];
  };
}

return {bytes: factory};

});
