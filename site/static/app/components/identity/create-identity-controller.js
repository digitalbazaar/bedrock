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

var deps = ['$scope', '$http', '$window', 'config'];
return {CreateIdentityController: deps.concat(factory)};

function factory($scope, $http, $window, config) {
  var self = this;
  self.data = config.data;
  self.feedback = {};
  // FIXME: temporary code to be removed after feedback improvements.
  //      : also remove the id fom the form in create.tpl.
  self.feedbackTarget = $('#createIdentityFeedbackTarget');
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
    self.loading = true;
    Promise.resolve($http.post('/join', self.identity))
      .then(function(response) {
        // redirect to new dashboard
        $window.location = response.data.id + '/dashboard';
      }).catch(function(err) {
        self.loading = false;
        self.feedback.error = err;
        $scope.$apply();
      });
  };
}

});
