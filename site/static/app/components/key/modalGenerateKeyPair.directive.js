/*!
 * Generate Key Pair Modal.
 *
 * Copyright (c) 2014 Accreditrust, LLC. All rights reserved.
 *
 * @author Dave Longley
 */
define(['forge/pki'], function(pki) {

var deps = ['svcModal', 'svcKey'];
return {modalGenerateKeyPair: deps.concat(factory)};

function factory(svcModal) {
  function Ctrl($scope, config, svcKey) {
    var model = $scope.model = {};
    model.feedback = {};
    model.identity = config.data.identity;
    model.mode = 'generate';
    model.loading = false;
    model.success = false;
    model.state = {
      keys: svcKey.state
    };
    model.key = {
      '@context': config.data.contextUrl,
      label: 'Signing Key 1'
    };

    // prepare forge
    var forge = {pki: pki()};

    model.generateKeyPair = function() {
      $scope.model.loading = true;
      var promise = new Promise(function(resolve, reject) {
        var bits = config.data.keygen.bits;
        forge.pki.rsa.generateKeyPair({
          bits: bits,
          workers: -1,
          //workLoad: 100,
          workerScript: '/forge/prime.worker.js'
        }, function(err, keypair) {
          if(err) {
            reject(err);
          }
          else {
            resolve(keypair);
          }
        });
      });
      promise.then(function(keypair) {
        var pem = {
          privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
          publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
        };
        model.key.privateKeyPem = pem.privateKey;
        model.key.publicKeyPem = pem.publicKey;

        $scope.model.loading = false;
        $scope.model.success = true;
        $scope.$apply();
      }).catch(function(err) {
        $scope.model.loading = false;
        $scope.model.success = false;
        $scope.model.feedback.error = err;
        $scope.$apply();
      });
    };

    model.addKey = function() {
      $scope.model.loading = true;
      var promise = svcKey.collection.add(model.key);
      promise.then(function(key) {
        $scope.model.loading = false;
        $scope.model.feedback.error = null;
        $scope.modal.close(null, key);
        $scope.$apply();
      }).catch(function(err) {
        $scope.model.feedback.error = err;
        $scope.model.success = false;
        $scope.model.loading = false;
        $scope.$apply();
      });
    };
  }

  return svcModal.directive({
    name: 'GenerateKeyPair',
    scope: {},
    templateUrl: '/app/components/key/modal-generate-key-pair.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl],
    link: function(scope, element, attrs) {
      scope.model.feedbackTarget = element;
    }
  });
}

});
