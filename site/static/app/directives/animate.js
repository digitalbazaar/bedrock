/*!
 * JQuery Animate directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$parse'];
return {animate: deps.concat(factory)};

function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      scope.$watch(attrs.animate, function(value) {
        if(value) {
          var options = ($parse(attrs.animateOptions) || angular.noop)();
          if(!angular.isArray(options)) {
            options = [options];
          }
          var fn = $parse(attrs.animateCallback) || angular.noop;
          var animate = function() {
            var next = options.shift();
            if(!next) {
              return scope.$apply(function() {
                fn(scope);
              });
            }
            element.animate(next.properties, next.duration, function() {
              animate();
            });
          };
          animate();
        }
      });
    }
  };
}

});
