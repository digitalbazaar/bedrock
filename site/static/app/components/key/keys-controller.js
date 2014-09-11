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

/* @ngInject */
function factory($routeParams, brIdentityService, brKeyService, config) {
  var self = this;
  var _keys = brKeyService.get({
    identityMethod: 'route'
  });
  self.identity = brIdentityService.identity;
  self.isOwner = self.identity && (self.identity.id === _keys.identityId);
  self.state = _keys.state;
  self.keys = _keys.keys;
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

    brIdentityService.collection.update(update)
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
      _keys.revoke(self.modals.key.id);
    }
    self.modals.key = null;
  };

  _keys.collection.getAll();
}

return {KeysController: factory};

});
