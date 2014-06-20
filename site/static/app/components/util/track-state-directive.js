/*!
 * Track State directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$parse'];
return {trackState: deps.concat(factory)};

function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      var state;
      attrs.$observe('trackState', function(value) {
        // init scope state object
        var get = $parse(value);
        var set = get.assign || angular.noop;
        state = get(scope) || {};
        // expose tag name for use by other directives that operate
        // on state information
        if(!('element' in state)) {
          state.element = {
            tagName: element.prop('tagName').toLowerCase()
          };
        }
        if(!('pressed' in state)) {
          state.pressed = false;
        }
        if(!('mouseover' in state)) {
          state.mouseover = false;
        }
        set(scope, state);
      });

      // track events
      element.focus(function() {
        scope.$apply(function() {
          state.focus = true;
        });
      });
      element.blur(function() {
        scope.$apply(function() {
          state.focus = false;
        });
      });
      element.mouseenter(function() {
        scope.$apply(function() {
          state.mouseover = true;
        });
      });
      element.mouseleave(function() {
        scope.$apply(function() {
          state.mouseover = false;
        });
      });
    }
  };
}

});
