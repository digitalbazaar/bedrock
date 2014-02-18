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

      // init scope state object
      var get = $parse(attrs.helpToggle);
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
      element.click(function(event) {
        event.preventDefault();
        scope.$apply(function() {
          var state = get(scope) || {};
          state.pressed = !state.pressed;
          state.show = state.pressed;
          if(state.pressed) {
            element.addClass('active');
          }
          else {
            element.removeClass('active');
          }
          set(scope, state);
        });
      });
      var localMouseover = false;
      var showId = null;
      element.mouseenter(function() {
        scope.$apply(function() {
          var state = get(scope) || {};
          state.mouseover = true;
          localMouseover = true;
          set(scope, state);
          if(!state.pressed) {
            // show help after a short delay
            showId = setTimeout(function() {
              scope.$apply(function() {
                state = get(scope) || {};
                if(localMouseover) {
                  state.show = true;
                }
                set(scope, state);
              });
            }, 500);
          }
        });
      });
      element.mouseleave(function() {
        scope.$apply(function() {
          var state = get(scope) || {};
          state.mouseover = false;
          localMouseover = false;
          clearTimeout(showId);
          if(!state.pressed) {
            // hide immediately
            state.show = false;
          }
          set(scope, state);
        });
      });

      function toggleElement(value) {
        if(value) {
          element.parent().addClass('help-toggle-on');
          if(element.is(':animated')) {
            // cancel current fade in/out
            element.stop(true, true).css('opacity', '1');
          }
          else {
            // use opacity to preserve layout
            $(element).animate({opacity: '1'}, 400);
          }
        }
        else {
          element.parent().removeClass('help-toggle-on');
          if(element.is(':animated')) {
            // cancel current fade in/out
            element.stop(true, true).css('opacity', '0');
          }
          else {
            // use opacity to preserve layout
            $(element).animate({opacity: '0'}, 400);
          }
        }
      }

      // when focus changes, toggle element
      var attr = attrs.helpToggle;
      var expression = attr + '.focus || ' + attr + '.mouseover';
      scope.$watch(expression, function(value) {
        // only make changes if not pressed
        var state = get(scope) || {};
        if(!state.pressed) {
          toggleElement(value);
        }
      });
    }
  };
}

});
