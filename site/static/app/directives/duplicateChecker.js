/*!
 * Duplicate Checker.
 *
 * @author Dave Longley
 */
define([], function() {

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
      // hide feedback until input changes
      element.addClass('alert').hide();

      scope.result = false;
      var lastInput = null;
      var timer = null;
      var init = false;

      function change(value) {
        // determine if owner input is ready
        var baseUrl = window.location.protocol + '//' + window.location.host;
        var ownerReady = (scope.owner === undefined ||
          scope.owner.length > (baseUrl + '/i/').length);

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
        }
        else if(value !== lastInput) {
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
              }
              else {
                timer = null;
                if(scope.type === 'email') {
                  lastCheck = scope.input;
                }
                else {
                  lastCheck = $filter('slug')(scope.input);
                }
                var data = {type: scope.type};
                if(scope.type === 'email') {
                  data.email = lastCheck;
                }
                else {
                  data.psaSlug = lastCheck;
                }
                $http.post('/identifier', $.extend(
                  data, scope.owner ? {owner: scope.owner} : {}))
                  .success(function() {
                    // available
                    scope.result = true;
                    // FIXME: hack, remove once why it is needed to update
                    // the scope is determined
                    setTimeout(function() {scope.$apply();});
                    element
                      .hide()
                      .removeClass('alert-error alert-success')
                      .addClass('alert-success')
                      .text(scope.available)
                      .fadeIn('slow');
                  })
                  .error(function(data, status) {
                    scope.result = false;
                    // FIXME: hack, remove once why it is needed to update
                    // the scope is determined
                    setTimeout(function() {scope.$apply();});
                    element.hide().removeClass('alert-error alert-success');
                    if(status === 400) {
                      // invalid
                      element
                        .text(scope.invalid)
                        .addClass('alert-error')
                        .fadeIn('slow');
                    }
                    else if(status === 409) {
                      element
                        .text(scope.taken)
                        .addClass('alert-error')
                        .fadeIn('slow');
                    }
                    else {
                      // FIXME: report server errors
                    }
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
