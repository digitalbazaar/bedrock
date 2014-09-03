/*!
 * Identity Credentials UI.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(
  $http, $location, $sanitize, $scope, brAlertService, brIdentityService, config) {
  var self = this;
  self.loading = false;
  self.identity = brIdentityService.identity;
  self.identityCredentials = config.data.identityCredentials;

  self.authorize = function(accept) {
    // TODO: modify query to reflect user's choices from UI
    var query;
    if(accept) {
      query = self.identityCredentials.query;
    } else {
      query = {'@context': 'https://w3id.org/identity/v1'};
    }
    self.loading = true;
    brAlertService.clearFeedback();
    Promise.resolve($http.post($location.absUrl() + '&authorize=true', {
      query: JSON.stringify(query)
    })).then(function(response) {
      // TODO: support no callback case
      // submit response to callback
      var identity = $sanitize(JSON.stringify(response.data));
      var form = document.createElement('form');
      form.setAttribute('method', 'post');
      form.setAttribute('action', self.identityCredentials.callback);
      form.innerHTML =
        '<input type="hidden" name="identity" value="' + identity + '" />';
      form.submit();
    }).catch(function(err) {
      self.loading = false;
      brAlertService.add('error', err);
      $scope.$apply();
    });
  };
}

return {IdentityCredentialsController: factory};

});
