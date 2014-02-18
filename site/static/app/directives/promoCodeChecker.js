/*!
 * Promo Code Checker.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$parse', '$http'];
return {promoCodeChecker: deps.concat(factory)};

function factory($parse, $http) {
  return {
    restrict: 'A',
    scope: {
      input: '=promoCodeChecker',
      state: '=promoCodeCheckerState'
    },
    link: function(scope, element, attrs) {
      // init state object
      var state = {
        loading: false,
        promo: null,
        notFound: false,
        expired: false
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
        state.promo = null;
        state.notFound = false;
        state.expired = false;

        // nothing to check
        if(value === undefined || value.length === 0) {
          state.loading = false;
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

          $http.get(encodeURI('/promos/' + scope.input))
            .success(function(data) {
              // promo found
              state.loading = false;
              var now = new Date();
              var expires = new Date(data.expires);
              if(expires <= now || data.redeemable === 0) {
                state.expired = true;
              }
              else {
                state.promo = data;
              }
            })
            .error(function(data, status) {
              state.loading = false;
              state.notFound = true;
            });
        }, 1000);
      });
    }
  };
}

});
