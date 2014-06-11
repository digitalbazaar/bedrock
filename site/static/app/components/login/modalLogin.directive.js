/*!
 * Login Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['svcModal'];
return {modalLogin: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope, config, $http) {
    var model = $scope.model = {};
    model.feedback = {};
    model.sysIdentifier = config.data.identity.id;
    model.password = '';
    model.loading = false;

    model.login = function() {
      $scope.loading = true;
      Promise.resolve($http.post('/session/login', {
        sysIdentifier: model.sysIdentifier,
        password: model.password
      })).then(function(response) {
        // success, close modal
        $scope.modal.close(null);
        $scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        if(err.type === 'bedrock.validation.ValidationError') {
          model.feedback.error = {
            message: 'The password you entered was incorrect. Please try again.'
          };
        } else {
          model.feedback.error = err;
        }
        $scope.$apply();
      });
    };
  }

  return svcModal.directive({
    name: 'Login',
    scope: {},
    templateUrl: '/app/components/login/modal-login.html',
    controller: ['$scope', 'config', '$http', Ctrl],
    link: function(scope, element, attrs) {
      scope.model.feedbackTarget = element;
    }
  });
}

});
