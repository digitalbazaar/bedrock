/*!
 * Help Toggle directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$parse', '$timeout'];
return {helpToggle: deps.concat(factory)};

function factory($parse, $timeout) {
  return {
    link: function(scope, element, attrs) {
      // hide (use opacity to preserve layout), make element untabbable
      element.css('opacity', '0');
      element.attr('tabindex', '-1');
      element.parent().addClass('help-toggle');

      // FIXME: hacks for bootstrap, prevent wiggling during fade in/out
      if(element.parent().hasClass('input-append')) {
        element.css('margin-left', '-1px');
        element.parent().css('font-size', '0');
      }

      var state;
      var helpState;
      attrs.$observe('helpToggle', function(value) {
        // init scope state object
        var get = $parse(value);
        var set = get.assign || angular.noop;
        state = get(scope) || {};
        if(!('help' in state)) {
          state.help = {
            // ignore focus changes by default w/textarea
            ignoreFocus: (state.element && state.element.tagName === 'textarea')
          };
        }
        helpState = state.help;
        if(!('pressed' in helpState)) {
          helpState.pressed = false;
        }
        if(!('mouseover' in helpState)) {
          helpState.mouseover = false;
        }
        set(scope, state);
      });

      // track events
      element.click(function(event) {
        event.preventDefault();
        scope.$apply(function() {
          helpState.pressed = !helpState.pressed;
          state.show = helpState.show = helpState.pressed;
          if(helpState.pressed) {
            element.addClass('active');
          } else {
            element.removeClass('active');
          }
        });
      });
      var showPromise = null;
      element.mouseenter(function() {
        scope.$apply(function() {
          helpState.mouseover = true;
          if(!helpState.pressed) {
            // show help after a short delay
            showPromise = $timeout(function() {
              if(helpState.mouseover) {
                state.show = helpState.show = true;
              }
            }, 500);
          }
        });
      });
      element.mouseleave(function() {
        scope.$apply(function() {
          helpState.mouseover = false;
          $timeout.cancel(showPromise);
          if(!helpState.pressed) {
            // hide immediately
            state.show = helpState.show = false;
          }
        });
      });

      // toggle help button display based on focus/mouse over changes
      var attr = attrs.helpToggle;
      scope.$watch(attr + '.focus', toggleElement);
      scope.$watch(attr + '.mouseover', toggleElement);
      scope.$watch(attr + '.help.mouseover', toggleElement);

      function toggleElement(value) {
        // use timeout to allow mouse to transition smoothly from
        // element to help element (avoids canceling the animation that shows
        // the help element in that case)
        $timeout(function() {
          // state not initialized yet
          if(!state) {
            return;
          }
          // nothing to change if help element is pressed (active)
          if(helpState.pressed) {
            return;
          }

          if(state.mouseover || state.help.mouseover ||
            (state.focus && !state.help.ignoreFocus)) {
            // already shown/showing
            if(element.parent().hasClass('help-toggle-on')) {
              return;
            }
            // mouse over element or help element or element is in focus and
            // focus is not ignored, so show help element
            element.parent().addClass('help-toggle-on');
            // cancel current animation
            if(element.is(':animated')) {
              element.stop(true, true);
            }
            // use opacity to preserve layout
            $(element).animate({opacity: '1'}, 400);
          } else {
            // already hidden/hiding
            if(!element.parent().hasClass('help-toggle-on')) {
              return;
            }
            // mouse not over element or help element, hide help element
            element.parent().removeClass('help-toggle-on');
            // cancel current animation
            if(element.is(':animated')) {
              element.stop(true, true);
            }
            // use opacity to preserve layout
            $(element).animate({opacity: '0'}, 400);
          }
        });
      }
    }
  };
}

});
