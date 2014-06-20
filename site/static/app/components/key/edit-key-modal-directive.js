/*!
 * Edit Key Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['svcAlert', 'svcModal'];
return {modalEditKey: deps.concat(factory)};

function factory(svcAlert, svcModal) {
  function Ctrl($scope, config, svcKey) {
    var model = $scope.model = {};
    model.identity = config.data.identity || {};
    model.mode = 'edit';
    model.loading = false;
    // copy source budget for editing
    model.key = {};
    angular.extend(model.key, $scope.sourceKey);

    model.editKey = function() {
      // set all fields from UI
      var key = {
        '@context': config.data.contextUrl,
        id: model.key.id,
        label: model.key.label
      };

      model.loading = true;
      svcAlert.clearModalFeedback($scope);
      var promise = svcKey.collection.update(key);
      promise.then(function(key) {
        model.loading = false;
        $scope.modal.close(null, key);
        $scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        svcAlert.add('error', err);
        $scope.$apply();
      });
    };
  }

  return svcModal.directive({
    name: 'EditKey',
    scope: {sourceKey: '=key'},
    templateUrl: '/app/components/key/edit-key-modal.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl]
  });
}

});
