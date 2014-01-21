/*!
 * Track State directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$parse'];
return {trackState: deps.concat(factory)};

function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      // init scope state object
      var get = $parse(attrs.trackState);
      var set = get.assign || angular.noop;
      var state = get(scope) || {};
      if(!('pressed' in state)) {
        state.pressed = false;
      }
      if(!('mouseover' in state)) {
        state.mouseover = false;
      }
      set(scope, state);

      // track events
      element.focus(function() {
        scope.$apply(function() {
          var state = get(scope) || {};
          state.focus = true;
          set(scope, state);
        });
      });
      element.blur(function() {
        scope.$apply(function() {
          var state = get(scope) || {};
          state.focus = false;
          set(scope, state);
        });
      });
      element.mouseenter(function() {
        scope.$apply(function() {
          var state = get(scope) || {};
          state.mouseover = true;
          set(scope, state);
        });
      });
      element.mouseleave(function() {
        scope.$apply(function() {
          var state = get(scope) || {};
          state.mouseover = false;
          set(scope, state);
        });
      });
    }
  };
}

});
