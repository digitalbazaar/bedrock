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
function factory(AlertService, KeyService, ModalService, config) {
  return ModalService.directive({
    name: 'editKey',
    scope: {sourceKey: '=key'},
    templateUrl: '/app/components/key/edit-key-modal.html',
    link: Link
  });

  function Link(scope) {
    var model = scope.model = {};
    model.identity = config.data.identity || {};
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
      AlertService.clearModalFeedback(scope);
      var promise = KeyService.collection.update(key);
      promise.then(function(key) {
        model.loading = false;
        scope.modal.close(null, key);
        scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        AlertService.add('error', err);
        scope.$apply();
      });
    };
  }
}

return {editKeyModal: factory};

});
