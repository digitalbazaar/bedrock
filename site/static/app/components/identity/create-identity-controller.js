/*!
 * Identity Creation Controller.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author Manu Sporny
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($scope, $http, $window, AlertService, config) {
  var self = this;
  self.data = config.data;
  self.loading = false;
  self.identity = {
    '@context': config.data.contextUrl,
    type: 'Identity',
    label: '',
    email: '',
    sysPassword: '',
    sysPublic: [],
    sysSlug: ''
  };
  self.agreementChecked = false;

  self.submit = function() {
    if(!self.agreementChecked) {
      return false;
    }
    AlertService.clearFeedback();
    self.loading = true;
    Promise.resolve($http.post('/join', self.identity))
      .then(function(response) {
        // redirect to new dashboard
        $window.location = response.data.id + '/dashboard';
      }).catch(function(err) {
        AlertService.add('error', err);
        self.loading = false;
        $scope.$apply();
      });
  };
}

return {CreateIdentityController: factory};

});
