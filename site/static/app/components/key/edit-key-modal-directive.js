/*!
 * Edit Key Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory(AlertService, IdentityService, KeyService, config) {
  return {
    restrict: 'A',
    scope: {sourceKey: '=brKey'},
    require: '^stackable',
    templateUrl: '/app/components/key/edit-key-modal.html',
    link: Link
  };

  function Link(scope, element, attrs, stackable) {
    var model = scope.model = {};
    model.identity = IdentityService.identity || {};
    model.mode = 'edit';
    model.loading = false;
    // copy source budget for editing
    model.key = {};
    angular.extend(model.key, scope.sourceKey);

    model.editKey = function() {
      // set all fields from UI
      var key = {
        '@context': config.data.contextUrl,
        id: model.key.id,
        label: model.key.label
      };

      model.loading = true;
      AlertService.clearFeedback();
      var promise = KeyService.collection.update(key);
      promise.then(function(key) {
        model.loading = false;
        stackable.close(null, key);
        scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        AlertService.add('error', err, {scope: scope});
        scope.$apply();
      });
    };
  }
}

return {brEditKeyModal: factory};

});
