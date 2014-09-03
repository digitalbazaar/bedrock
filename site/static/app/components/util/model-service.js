/*!
 * Model Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($rootScope) {
  var service = {};

  service.replace = function(dst, src, fn) {
    if(dst !== src) {
      angular.forEach(dst, function(dstValue, key) {
        if(!(key in src)) {
          // preserve $$hashKey, needed for ng-repeat directives
          if(key !== '$$hashKey') {
            delete dst[key];
          }
        } else {
          // do deep replacement
          var srcValue = src[key];
          if(angular.isArray(dstValue) && angular.isArray(srcValue)) {
            service.replaceArray(dstValue, srcValue, fn);
          } else if(angular.isObject(dstValue) && angular.isObject(srcValue)) {
            service.replace(dstValue, srcValue);
          } else {
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
    var fn = id;
    if(!angular.isFunction(id)) {
      fn = function(element, candidate) {
        return element[id] === candidate[id];
      };
    }
    for(var i = 0; i < array.length; ++i) {
      if(fn(array[i], src)) {
        return service.replace(array[i], src);
      }
    }
    array.push(src);
    return src;
  };

  service.replaceArray = function(dst, src, id) {
    id = id || 'id';
    var fn = id;
    if(!angular.isFunction(id)) {
      fn = function(element, candidate) {
        return (angular.isObject(element) && angular.isObject(candidate) &&
          element[id] === candidate[id]);
      };
    }
    var dst_ = dst.slice();
    dst.splice(0, dst.length);
    angular.forEach(src, function(value) {
      // overwrite existing object value in dst_ if exists
      for(var i = 0; i < dst_.length; ++i) {
        if(fn(dst_[i], value)) {
          value = service.replace(dst_[i], value);
          dst_.splice(i, 1);
          break;
        }
      }
      dst.push(value);
    });
    return dst;
  };

  service.removeFromArray = function(array, fn, id) {
    if(!(angular.isArray(array) && angular.isFunction(fn))) {
      // backwards-compatibility, treat 'array' as target to remove,
      // 'fn' as array and 'id' as optional key to compare
      id = id || 'id';
      var target = array;
      array = fn;
      fn = function(element) {
        if(typeof target === 'object') {
          return element[id] === target[id];
        }
        return element[id] === target;
      };
    }
    for(var i = 0; i < array.length; ++i) {
      if(fn(array[i])) {
        array.splice(i, 1);
        break;
      }
    }
  };

  service.removeAllFromArray = function(array, fn, key) {
    if(!(angular.isArray(array) && angular.isFunction(fn))) {
      // backwards-compatibility, treat 'array' as target to remove,
      // 'fn' as array and 'key' as optional key to compare
      key = key || 'id';
      var target = array;
      array = fn;
      fn = function(element) {
        if(typeof target === 'object') {
          return element[key] === target[key];
        }
        return element[key] === target;
      };
    }
    for(var i = 0; i < array.length; ++i) {
      if(fn(array[i])) {
        array.splice(i, 1);
        --i;
      }
    }
  };

  // expose service to scope
  $rootScope.app.services.model = service;

  return service;
}

return {brModelService: factory};

});
