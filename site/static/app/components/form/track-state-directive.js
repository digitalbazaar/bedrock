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
    restrict: 'A',
    link: Link
  };

  function Link(scope, element, attrs) {
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

    scope.$watch(function() {
      return state;
    }, function() {
      if(!state) {
        return;
      }
      var states = ['focus', 'help', 'mouseover', 'pressed', 'show'];
      for(var key in state) {
        if(states.indexOf(key) === -1) {
          continue;
        }
        element.toggleClass('br-' + key, !!state[key]);
        if(key === 'help') {
          for(var helpKey in state.help) {
            element.toggleClass('br-help-' + helpKey, !!state.help[helpKey]);
          }
        }
      }
    }, true);

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
}

return {trackState: factory};

});
