/*!
 * Help Toggle directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$parse'];
return {helpToggle: deps.concat(factory)};

function factory($parse) {
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
          state.help = {};
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
      var showId = null;
      element.mouseenter(function() {
        scope.$apply(function() {
          helpState.mouseover = true;
          if(!helpState.pressed) {
            // show help after a short delay
            showId = setTimeout(function() {
              scope.$apply(function() {
                if(helpState.mouseover) {
                  state.show = helpState.show = true;
                }
              });
            }, 500);
          }
        });
      });
      element.mouseleave(function() {
        scope.$apply(function() {
          helpState.mouseover = false;
          clearTimeout(showId);
          if(!helpState.pressed) {
            // hide immediately
            state.show = helpState.show = false;
          }
        });
      });

      // toggle help button display when mouse over
      var attr = attrs.helpToggle;
      scope.$watch(
        attr + '.mouseover || ' + attr + '.help.mouseover', toggleElement);

      // toggle help button when focus changes unless state var prohibits it
      scope.$watch(attr + '.focus', function(value) {
        if(!state || state.help.ignoreFocus) {
          return;
        }
        toggleElement(value);
      });

      function toggleElement(value) {
        // state not initialized yet
        if(!state) {
          return;
        }

        // only make changes if not pressed
        if(helpState.pressed) {
          return;
        }

        if(state.mouseover || state.help.mouseover) {
          // mouse over element or help toggle, show help element
          element.parent().addClass('help-toggle-on');
          if(element.is(':animated')) {
            // cancel current fade in/out
            element.stop(true, true).css('opacity', '1');
          } else {
            // use opacity to preserve layout
            $(element).animate({opacity: '1'}, 400);
          }
        } else {
          // mouse not over element or help toggle, hide help element
          element.parent().removeClass('help-toggle-on');
          if(element.is(':animated')) {
            // cancel current fade in/out
            element.stop(true, true).css('opacity', '0');
          } else {
            // use opacity to preserve layout
            $(element).animate({opacity: '0'}, 400);
          }
        }
      }
    }
  };
}

});
