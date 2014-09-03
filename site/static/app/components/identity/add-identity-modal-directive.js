/*!
 * Add Identity Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory(brAlertService, brIdentityService, config) {
  return {
    restrict: 'A',
    scope: {identityTypes: '=brIdentityTypes'},
    require: '^stackable',
    templateUrl: '/app/components/identity/add-identity-modal.html',
    link: Link
  };

  function Link(scope, element, attrs, stackable) {
    scope.model = {};
    scope.data = config.data;
    scope.baseUrl = config.data.baseUri;
    scope.loading = false;
    // identity
    scope.identityType = scope.identityTypes[0];
    scope.identityLabel = '';
    scope.identitySlug = '';
    scope.identity = {};
    scope.identityTypeLabels = {
      'Identity': 'Identity'
    };
    angular.forEach(scope.identityTypes, function(type) {
      scope.identity[type] = {
        '@context': config.data.contextUrl,
        type: type
      };
    });

    scope.addIdentity = function() {
      var identity = scope.identity[scope.identityType];
      identity.label = scope.identityLabel;
      identity.sysSlug = scope.identitySlug;
      scope.loading = true;
      brAlertService.clearFeedback();
      brIdentityService.collection.add(identity).then(function(identity) {
        scope.loading = false;
        stackable.close(null, {identity: identity});
        scope.$apply();
      }).catch(function(err) {
        scope.loading = false;
        brAlertService.add('error', err, {scope: scope});
        scope.$apply();
      });
    };
  }
}

return {brAddIdentityModal: factory};

});
