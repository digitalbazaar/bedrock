/*!
 * Duplicate Checker.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($http, $filter, brAlertService, config) {
  return {
    restrict: 'A',
    scope: {
      input: '=brDuplicateChecker',
      type: '@brDuplicateCheckerType',
      available: '@brDuplicateCheckerAvailable',
      invalid: '@brDuplicateCheckerInvalid',
      taken: '@brDuplicateCheckerTaken',
      checking: '@brDuplicateCheckerChecking',
      owner: '@brDuplicateCheckerOwner',
      result: '=brDuplicateCheckerResult'
    },
    link: Link
  };

  function Link(scope, element) {
    scope.data = config.data || {};

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
          .removeClass('alert-danger alert-success alert-warning')
          .addClass('alert-warning')
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
              var data = {};
              if(scope.type === 'email') {
                data.email = lastInput;
              } else {
                data.sysSlug = lastInput;
              }
              Promise.resolve(
                $http.post('/identifier/' + scope.type, $.extend(
                data, scope.owner ? {owner: scope.owner} : {})))
                .then(function() {
                  // available
                  scope.result = true;
                  element
                    .hide()
                    .removeClass('alert-danger alert-success alert-warning')
                    .addClass('alert-success')
                    .text(scope.available)
                    .fadeIn('slow');
                  scope.$apply();
                }).catch(function(err) {
                  scope.result = false;
                  element.hide().removeClass(
                    'alert-danger alert-success alert-warning');
                  var status = (err.details && err.details.httpStatusCode ?
                    err.details.httpStatusCode : 500);
                  if(status === 400) {
                    // invalid
                    element
                      .text(scope.invalid)
                      .addClass('alert-danger')
                      .fadeIn('slow');
                  } else if(status === 409) {
                    element
                      .text(scope.taken)
                      .addClass('alert-danger')
                      .fadeIn('slow');
                  } else {
                    brAlertService.add('error', err);
                  }
                  scope.$apply();
                });
            }
          });
        }, 1000);
      }
    }

    scope.$watch('input', change);
    scope.$watch('owner', function() {
      change(scope.input);
    });
  }
}

return {brDuplicateChecker: factory};

});
