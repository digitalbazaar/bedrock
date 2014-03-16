/*!
 * Model Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = [];
return {svcModel: deps.concat(factory)};

function factory() {
  var service = {};

  service.replace = function(dst, src) {
    if(dst !== src) {
      angular.forEach(dst, function(dstValue, key) {
        if(!(key in src)) {
          // preserve $$hashKey, needed for ng-repeat directives
          if(key !== '$$hashKey') {
            delete dst[key];
          }
        }
        else {
          // do deep replacement
          var srcValue = src[key];
          if(angular.isArray(dstValue) && angular.isArray(srcValue)) {
            // assumes 'id' property means value match
            service.replaceArray(dstValue, srcValue);
          }
          else if(angular.isObject(dstValue) && angular.isObject(srcValue)) {
            service.replace(dstValue, srcValue);
          }
          else {
            dst[key] = srcValue;
          }
        }
      });
      angular.forEach(src, function(srcValue, key) {
        if(!(key in dst)) {
          dst[key] = srcValue;
        }
      });
    }
    return dst;
  };

  service.replaceInArray = function(array, src, id) {
    id = id || 'id';
    var found = false;
    for(var i = 0; !found && i < array.length; ++i) {
      if(array[i][id] === src[id]) {
        service.replace(array[i], src);
        found = true;
      }
    }
    if(!found) {
      array.push(src);
    }
  };

  service.replaceArray = function(dst, src, id) {
    id = id || 'id';
    var dst_ = dst.slice();
    dst.splice(0, dst.length);
    angular.forEach(src, function(value) {
      var valueIsObject = angular.isObject(value);
      // overwrite existing object value in dst_ if exists
      for(var i = 0; i < dst_.length; ++i) {
        if(angular.isObject(dst_[i]) && valueIsObject &&
          dst_[i][id] === value[id]) {
          value = service.replace(dst_[i], value);
          dst_.splice(i, 1);
          break;
        }
      }
      dst.push(value);
    });
    return dst;
  };

  service.removeFromArray = function(target, array, id) {
    id = id || 'id';
    for(var i = 0; i < array.length; ++i) {
      if(typeof target === 'object') {
        if(array[i][id] === target[id]) {
          array.splice(i, 1);
          break;
        }
      }
      else if(array[i][id] === target) {
        array.splice(i, 1);
        break;
      }
    }
  };

  return service;
}

});
