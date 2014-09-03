/*!
 * Generate Key Pair Modal.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['forge/pki'], function(pki) {

/* @ngInject */
function factory(brAlertService, brKeyService, config) {
  return {
    restrict: 'A',
    scope: {},
    require: '^stackable',
    templateUrl: '/app/components/key/generate-key-pair-modal.html',
    link: Link
  };

  function Link(scope, element, attrs, stackable) {
    var model = scope.model = {};
    model.identity = config.data.identity;
    model.mode = 'generate';
    model.loading = false;
    model.success = false;
    model.state = {
      keys: brKeyService.state
    };
    model.key = {
      '@context': config.data.contextUrl,
      label: 'Signing Key 1'
    };

    // prepare forge
    var forge = {pki: pki()};

    model.generateKeyPair = function() {
      model.loading = true;
      brAlertService.clearFeedback();
      new Promise(function(resolve, reject) {
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
      }).then(function(keypair) {
        var pem = {
          privateKey: forge.pki.privateKeyToPem(keypair.privateKey),
          publicKey: forge.pki.publicKeyToPem(keypair.publicKey)
        };
        model.key.privateKeyPem = pem.privateKey;
        model.key.publicKeyPem = pem.publicKey;

        model.loading = false;
        model.success = true;
        scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        model.success = false;
        brAlertService.add('error', err, {scope: scope});
        scope.$apply();
      });
    };

    model.addKey = function() {
      model.loading = true;
      brAlertService.clearFeedback();
      brKeyService.collection.add(model.key).then(function(key) {
        model.loading = false;
        stackable.close(null, key);
        scope.$apply();
      }).catch(function(err) {
        brAlertService.add('error', err, {scope: scope});
        model.success = false;
        scope.model.loading = false;
        scope.$apply();
      });
    };
  }
}

return {brGenerateKeyPairModal: factory};

});
