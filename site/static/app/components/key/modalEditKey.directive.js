/*!
 * Edit Key Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['svcModal'];
return {modalEditKey: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope, config, svcKey) {
    var model = $scope.model = {};
    model.feedback = {};
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
      var promise = svcKey.collection.update(key);
      promise.then(function(key) {
        model.loading = false;
        $scope.modal.close(null, key);
        model.feedback.error = null;
        $scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        model.feedback.error = err;
        $scope.$apply();
      });
    };
  }

  return svcModal.directive({
    name: 'EditKey',
    scope: {sourceKey: '=key'},
    templateUrl: '/app/components/key/modal-edit-key.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl],
    link: function(scope, element, attrs) {
      scope.model.feedbackTarget = element;
    }
  });
}

});
