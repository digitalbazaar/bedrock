/*!
 * Track State directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($parse) {
  return {
    link: function(scope, element, attrs) {
      var state = {};
      attrs.$observe('trackState', function(value) {
        // init scope state object
        var get = $parse(value);
        var set = get.assign || angular.noop;
        state = get(scope) || state || {};
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
        state.focus = true;
        // use timeout because dialog.show[Modal]() can trigger this
        // event handler in the same tick
        setTimeout(function() {scope.$apply();});
      });
      element.blur(function() {
        state.focus = false;
        scope.$apply();
      });
      element.mouseenter(function() {
        state.mouseover = true;
        scope.$apply();
      });
      element.mouseleave(function() {
        state.mouseover = false;
        scope.$apply();
      });
    }
  };
}

return {trackState: factory};

});
