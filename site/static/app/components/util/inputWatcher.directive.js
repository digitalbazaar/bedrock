/*!
 * Input Watcher directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$parse', '$http'];
return {inputWatcher: deps.concat(factory)};

function factory($parse, $http) {
  return {
    restrict: 'A',
    scope: {
      input: '=inputWatcher',
      state: '=inputWatcherState',
      change: '&inputChange'
    },
    link: function(scope, element, attrs) {
      // init state object
      var state = {
        loading: false
      };
      scope.$watch('state', function(value) {
        if(value === undefined) {
          scope.state = state;
        }
      });

      // watch for changes to input
      var timer = null;
      scope.$watch('input', function(value) {
        // stop previous check
        clearTimeout(timer);

        // nothing to check
        if(value === undefined || value.length === 0) {
          state.loading = false;
          scope.change({
            input: '',
            state: scope.state,
            callback: function() {
              scope.$apply();
            }
          });
          return;
        }

        // start countdown to do check
        state.loading = true;
        timer = setTimeout(function() {
          timer = null;

          if(scope.input.length === 0) {
            state.loading = false;
            scope.$apply();
            return;
          }

          scope.change({
            input: scope.input,
            state: scope.state,
            callback: function() {
              state.loading = false;
              scope.$apply();
            }
          });
        }, 1000);
      });
    }
  };
}

});
