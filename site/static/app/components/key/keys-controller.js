/*!
 * Keys Controller.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define([], function() {

'use strict';

var deps = ['$routeParams', 'IdentityService', 'KeyService', 'config'];
return {KeysController: deps.concat(factory)};

function factory($routeParams, IdentityService, KeyService, config) {
  var self = this;
  self.identity = IdentityService.identity;
  self.state = KeyService.state;
  self.keys = KeyService.keys;
  self.modals = {
    showGenerateKeyPair: false,
    showAddKey: false,
    showEditKey: false,
    showRevokeKeyAlert: false,
    key: null
  };

  if($routeParams.service === 'add-key') {
    self.modals.showAddKey = true;
  }

  self.editKey = function(key) {
    self.modals.showEditKey = true;
    self.modals.key = key;
  };
  self.setDefaultSigningKeyId = function(keyId) {
    var update = {
      '@context': config.data.contextUrl,
      id: self.identity.id,
      sysSigningKey: keyId
    };

    IdentityService.collection.update(update)
      .catch(function(err) {
        // FIXME: show error feedback
        if(err) {
          console.error('setDefaultSigningKeyId error:', err);
        }
      });
  };
  self.revokeKey = function(key) {
    self.modals.showRevokeKeyAlert = true;
    self.modals.key = key;
  };
  self.confirmRevokeKey = function(err, result) {
    if(!err && result === 'ok') {
      KeyService.collection.revoke(self.modals.key.id);
    }
    self.modals.key = null;
  };

  KeyService.collection.getAll();
}

});
