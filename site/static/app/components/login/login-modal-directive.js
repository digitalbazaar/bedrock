/*!
 * Login Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($http, AlertService, RefreshService, config) {
  return {
    scope: {},
    require: '^stackable',
    templateUrl: '/app/components/login/login-modal.html',
    link: Link
  };

  function Link(scope, element, attrs, stackable) {
    var model = scope.model = {};
    model.sysIdentifier = config.data.identity.id;
    model.password = '';
    model.loading = false;

    model.login = function() {
      scope.loading = true;
      AlertService.clearFeedback();
      Promise.resolve($http.post('/session/login', {
        sysIdentifier: model.sysIdentifier,
        password: model.password
      })).then(function(response) {
        // success, close modal
        stackable.close(null);
        RefreshService.refresh();
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
