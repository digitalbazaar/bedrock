/*!
 * Login Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($http, AlertService, ModalService, config) {
  return ModalService.directive({
    name: 'login',
    scope: {},
    templateUrl: '/app/components/login/login-modal.html',
    link: Link
  });

  function Link(scope) {
    var model = scope.model = {};
    model.sysIdentifier = config.data.identity.id;
    model.password = '';
    model.loading = false;

    model.login = function() {
      scope.loading = true;
      AlertService.clearModalFeedback(scope);
      Promise.resolve($http.post('/session/login', {
        sysIdentifier: model.sysIdentifier,
        password: model.password
      })).then(function(response) {
        // success, close modal
        scope.modal.close(null);
        scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        if(err.type === 'bedrock.validation.ValidationError') {
          AlertService.add(
            'error',
            'The password you entered was incorrect. Please try again.');
        } else {
          AlertService.add('error', err);
        }
        scope.$apply();
      });
    };
  }
}

return {loginModal: factory};

});
