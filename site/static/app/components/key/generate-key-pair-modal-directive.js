/*!
 * Generate Key Pair Modal.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['forge/pki'], function(pki) {

var deps = ['svcAlert', 'svcModal', 'svcKey'];
return {modalGenerateKeyPair: deps.concat(factory)};

function factory(svcAlert, svcModal) {
  function Ctrl($scope, config, svcKey) {
    var model = $scope.model = {};
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
      model.loading = true;
      svcAlert.clearModalFeedback($scope);
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
          } else {
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

        model.loading = false;
        model.success = true;
        $scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        model.success = false;
        svcAlert.add('error', err);
        $scope.$apply();
      });
    };

    model.addKey = function() {
      model.loading = true;
      svcAlert.clearModalFeedback($scope);
      var promise = svcKey.collection.add(model.key);
      promise.then(function(key) {
        model.loading = false;
        $scope.modal.close(null, key);
        $scope.$apply();
      }).catch(function(err) {
        svcAlert.add('error', err);
        model.success = false;
        $scope.model.loading = false;
        $scope.$apply();
      });
    };
  }

  return svcModal.directive({
    name: 'GenerateKeyPair',
    scope: {},
    templateUrl: '/app/components/key/generate-key-pair-modal.html',
    controller: ['$scope', 'config', 'svcKey', Ctrl]
  });
}

});
