/*!
 * Add Key Modal.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define(['angular'], function(angular) {

'use strict';

var deps = [
  '$location', '$routeParams', '$sce', '$timeout', 'svcModal'
];
return {modalAddKey: deps.concat(factory)};

function factory($location, $routeParams, $sce, $timeout, svcModal) {
  function Ctrl($scope, config, svcKey) {
    var model = $scope.model = {};
    model.feedback = {};
    model.identity = config.data.identity;
    model.mode = 'add';
    model.loading = false;
    model.success = false;
    model.registrationCallback = null;
    model.callbackKey = null;
    model.state = {
      keys: svcKey.state
    };
    model.key = {
      '@context': config.data.contextUrl,
      label: 'Access Key 1',
      publicKeyPem: ''
    };
    if($routeParams.service === 'add-key') {
      model.key.label = $routeParams['public-key-label'];
      model.key.publicKeyPem = $routeParams['public-key'];
      // trust callback URL
      model.registrationCallback =
        $sce.trustAsResourceUrl($routeParams['registration-callback']);
    }
    // flag if PEM UI is needed
    model.needPem = !model.key.publicKeyPem;

    model.addKey = function() {
      model.loading = true;
      var promise = svcKey.collection.add(model.key);
      promise.then(function(key) {
        // replace key with newly created key data
        model.key = key;
        model.success = true;
        model.feedback.error = null;
        if(model.registrationCallback) {
          // setup form and submit page to the callback
          // if it fails, provide a manual submission backup

          // form data to send to callback
          model.callbackKey = {
            '@context': config.data.contextUrl,
            id: key.id
          };
          $scope.$apply();

          // attempt to auto-submit the form back to the registering site
          model.submit();

          // show the manual completion button after a timeout period
          $timeout(function() {
            model.loading = false;
            $scope.$apply();
          }, 5000);
        }
        else {
          // clear query params
          $location.search({});
          model.loading = false;
        }
        $scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        model.feedback.error = err;
        $scope.$apply();
      });
    };

    model.submit = function() {
      $location.search({});
      angular.element('#registration-form').submit();
    };

    model.done = function() {
      $scope.modal.close(null, model.key);
      $scope.$apply();
    };
  }

  return svcModal.directive({
    name: 'AddKey',
    scope: {},
    templateUrl: '/app/components/key/modal-add-key.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl],
    link: function(scope, element, attrs) {
      scope.model.feedbackTarget = element;
    }
  });
}

});