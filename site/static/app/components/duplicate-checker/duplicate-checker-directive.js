/*!
 * Duplicate Checker.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = ['$http', '$filter'];
return {duplicateChecker: deps.concat(factory)};

function factory($http, $filter) {
  return {
    restrict: 'A',
    scope: {
      input: '=duplicateChecker',
      type: '@duplicateCheckerType',
      available: '@duplicateCheckerAvailable',
      invalid: '@duplicateCheckerInvalid',
      taken: '@duplicateCheckerTaken',
      checking: '@duplicateCheckerChecking',
      owner: '@duplicateCheckerOwner',
      result: '=duplicateCheckerResult'
    },
    link: function(scope, element, attrs) {
      scope.data = window.data || {};

      // hide feedback until input changes
      element.addClass('alert').hide();

      scope.result = false;
      var lastInput = null;
      var timer = null;
      var init = false;

      function change(value) {
        // determine if owner input is ready
        var ownerReady = (scope.owner === undefined ||
          scope.owner.length > (scope.data.identityBaseUri + '/').length);

        // initialized once value is defined and owner is ready
        if(!init && value !== undefined && ownerReady) {
          init = true;
        }
        if(!init) {
          return;
        }

        // stop previous check
        clearTimeout(timer);

        // nothing to check
        if(value === undefined || value.length === 0 || !ownerReady) {
          scope.result = false;
          element.hide();
        } else if(value !== lastInput) {
          // show checking
          element
            .removeClass('alert-error alert-success')
            .text(scope.checking)
            .fadeIn('show');
          lastInput = null;
          scope.result = false;

          // start timer to check
          timer = setTimeout(function() {
            scope.$apply(function() {
              if(value.length === 0) {
                element.hide();
              } else {
                timer = null;
                if(scope.type === 'email') {
                  lastInput = scope.input;
                } else {
                  lastInput = $filter('slug')(scope.input);
                }
                var data = {type: scope.type};
                if(scope.type === 'email') {
                  data.email = lastInput;
                } else {
                  data.sysSlug = lastInput;
                }
                Promise.resolve($http.post('/identifier', $.extend(
                  data, scope.owner ? {owner: scope.owner} : {})))
                  .then(function() {
                    // available
                    scope.result = true;
                    element
                      .hide()
                      .removeClass('alert-error alert-success')
                      .addClass('alert-success')
                      .text(scope.available)
                      .fadeIn('slow');
                    scope.$apply();
                  }).catch(function(err) {
                    scope.result = false;
                    element.hide().removeClass('alert-error alert-success');
                    var status = (err.details && err.details.httpStatusCode ?
                      err.details.httpStatusCode : 500);
                    if(status === 400) {
                      // invalid
                      element
                        .text(scope.invalid)
                        .addClass('alert-error')
                        .fadeIn('slow');
                    } else if(status === 409) {
                      element
                        .text(scope.taken)
                        .addClass('alert-error')
                        .fadeIn('slow');
                    } else {
                      // FIXME: report server errors
                    }
                    scope.$apply();
                  });
              }
            });
          }, 1000);
        }
      }

      scope.$watch('input', change);
      scope.$watch('owner', function(value) {
        change(scope.input);
      });
    }
  };
}

});
