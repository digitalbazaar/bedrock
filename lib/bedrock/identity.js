/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  logger: require('./loggers').get('app'),
  mail: require('./mail'),
  permission: require('./permission'),
  profile: require('./profile'),
  security: require('./security'),
  tools: require('./tools')
};
var ursa = require('ursa');
var util = require('util');
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.identity';

// module permissions
var PERMISSIONS = {
  IDENTITY_ADMIN: MODULE_NS + '.permission.identity_admin',
  IDENTITY_ACCESS: MODULE_NS + '.permission.identity_access',
  IDENTITY_CREATE: MODULE_NS + '.permission.identity_create',
  IDENTITY_EDIT: MODULE_NS + '.permission.identity_edit',
  IDENTITY_REMOVE: MODULE_NS + '.permission.identity_remove',
  PUBLIC_KEY_CREATE: MODULE_NS + '.permission.public_key_create',
  PUBLIC_KEY_REMOVE: MODULE_NS + '.permission.public_key_remove'
};

// module API
var api = {};
api.name = MODULE_NS;
module.exports = bedrock.tools.extend(
  api
  // sub modules
);

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    function(callback) {
      // open all necessary collections
      bedrock.db.openCollections(['identity', 'publicKey'], callback);
    },
    function(callback) {
      // setup collections (create indexes, etc)
      bedrock.db.createIndexes([{
        collection: 'identity',
        fields: {id: 1},
        options: {unique: true, background: false}
      }, {
        collection: 'identity',
        fields: {'identity.sysSlug': 1},
        options: {unique: true, background: false}
      }, {
        collection: 'identity',
        fields: {owner: 1},
        options: {unique: false, background: false}
      }, {
        collection: 'publicKey',
        fields: {id: 1},
        options: {unique: true, background: false}
      }, {
        collection: 'publicKey',
        fields: {owner: 1, pem: 1},
        options: {unique: true, background: false}
      }], callback);
    },
    _registerPermissions,
    function(callback) {
      // create identities, ignoring duplicate errors
      async.forEachSeries(
        bedrock.config.identity.identities,
        function(i, callback) {
          _createIdentity(i, function(err) {
            if(err && bedrock.db.isDuplicateError(err)) {
              err = null;
            }
            callback(err);
          });
        },
        callback);
    },
    function(callback) {
      // add keys, ignoring duplicate errors
      async.forEachSeries(
        bedrock.config.identity.keys,
        function(i, callback) {
          var publicKey = i.publicKey;
          var privateKey = i.privateKey || null;
          _addIdentityPublicKey(publicKey, privateKey, function(err) {
            if(err && bedrock.db.isDuplicateError(err)) {
              err = null;
            }
            callback(err);
          });
        }, callback);
    },
    function(callback) {
      bedrock.mail.registerTrigger('fetchIdentity', function(event, callback) {
        api.getIdentity(
          null, event.details.identityId, function(err, identity) {
          if(!err) {
            event.details.identity = identity;
            event.details.profileId = identity.owner;
          }
          callback(err);
        });
      });
      callback();
    }
  ], callback);
};

/**
 * Creates an Identity ID from the given name.
 *
 * @param name the short identity name (slug).
 *
 * @return the Identity ID for the Identity.
 */
api.createIdentityId = function(name) {
  return util.format('%s%s/%s',
    bedrock.config.server.baseUri,
    bedrock.config.identity.basePath,
    encodeURIComponent(name));
};

/**
 * Gets the default Identity ID from the given Profile.
 *
 * (deprecated)
 *
 * @param profile the Profile to get the default Identity ID for.
 * @param callback(err, identityId) called once the operation completes.
 */
api.getProfileDefaultIdentityId = function(profile, callback) {
  async.waterfall([
    function(callback) {
      if('sysSlug' in profile) {
        callback(null, profile);
      }
      // get profile
      else {
        bedrock.profile.getProfile(
          profile, profile.id, function(err, profile) {
            callback(err, profile);
          });
      }
    },
    function(profile, callback) {
      // get default identity
      api.getProfileDefaultIdentity(profile, profile, function(err, identity) {
        callback(err, identity);
      });
    },
    function(identity, callback) {
      callback(null, identity.id);
    }
  ], callback);
};

/**
 * Creates a new Identity.
 *
 * The Identity must contain id and an owner.
 *
 * @param actor the Profile performing the action.
 * @param identity the Identity containing at least the minimum required data.
 * @param callback(err, record) called once the operation completes.
 */
api.createIdentity = function(actor, identity, callback) {
  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, identity,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_CREATE,
        api.checkIdentityOwner, callback);
    },
    function(callback) {
      _createIdentity(identity, callback);
    }
  ], callback);
};

/**
 * Gets the default Identity for the given Profile.
 *
 * @param actor the Profile performing the action.
 * @param profileId the ID of the Profile to get the default Identity ID for.
 * @param callback(err, identity, meta) called once the operation completes.
 */
api.getProfileDefaultIdentity = function(actor, profileId, callback) {
  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, {id: profileId},
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_ACCESS, callback);
    },
    function(callback) {
      bedrock.db.collections.identity.findOne(
        {owner: bedrock.db.hash(profileId)}, {},
        {sort: {'meta.created': 1}}, callback);
    },
    function(record, callback) {
      if(!record) {
        return callback(new BedrockError(
          'No default identity found for profile ID.',
          MODULE_NS + '.IdentityNotFound',
          {profileId: profileId}));
      }
      callback(null, record.identity, record.meta);
    }
  ], callback);
};

/**
 * Retrieves all Identities owned by a profile.
 *
 * @param actor the Profile performing the action.
 * @param profileId the ID of the profile.
 * @param callback(err, records) called once the operation completes.
 */
api.getProfileIdentities = function(actor, profileId, callback) {
  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, {id: profileId},
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_ACCESS, callback);
    },
    function(callback) {
      bedrock.db.collections.identity.find(
        {owner: bedrock.db.hash(profileId)}, {}).toArray(callback);
    }
  ], callback);
};

/**
 * Retrieves all Identities matching the given query.
 *
 * @param actor the Profile performing the action.
 * @param [query] the optional query to use (default: {}).
 * @param [fields] optional fields to include or exclude (default: {}).
 * @param [options] options (eg: 'sort', 'limit').
 * @param callback(err, records) called once the operation completes.
 */
api.getIdentities = function(actor, query, fields, options, callback) {
  // handle args
  if(typeof query === 'function') {
    callback = query;
    query = null;
    fields = null;
  }
  else if(typeof fields === 'function') {
    callback = fields;
    fields = null;
  }
  else if(typeof options === 'function') {
    callback = options;
    options = null;
  }

  query = query || {};
  fields = fields || {};
  options = options || {};
  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermission(
        actor, PERMISSIONS.IDENTITY_ADMIN, callback);
    },
    function(callback) {
      bedrock.db.collections.identity.find(
        query, fields, options).toArray(callback);
    }
  ], callback);
};

/**
 * Retrieves an Identity.
 *
 * @param actor the Profile performing the action.
 * @param id the ID of the Identity to retrieve.
 * @param callback(err, identity, meta) called once the operation completes.
 */
api.getIdentity = function(actor, id, callback) {
  async.waterfall([
    function(callback) {
      bedrock.db.collections.identity.findOne(
        {id: bedrock.db.hash(id)}, {}, callback);
    },
    function(record, callback) {
      if(!record) {
        return callback(new BedrockError(
          'Identity not found.',
          MODULE_NS + '.IdentityNotFound',
          {id: id, httpStatusCode: 404, 'public': true}));
      }
      callback(null, record.identity, record.meta);
    },
    function(identity, meta, callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, identity,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_ACCESS,
        api.checkIdentityOwner, function(err) {
          callback(err, identity, meta);
        });
    }
  ], callback);
};

/**
 * Updates an Identity. Only specific information contained in the passed
 * Identity will be updated. Restricted fields can not be updated in this
 * call, and may have their own API calls.
 *
 * @param actor the Profile performing the action.
 * @param identity the Identity to update.
 * @param callback(err) called once the operation completes.
 */
api.updateIdentity = function(actor, identity, callback) {
  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, identity,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_EDIT,
        api.checkIdentityOwner, callback);
    },
    function(callback) {
      // exclude restricted fields
      bedrock.db.collections.identity.update(
        {id: bedrock.db.hash(identity.id)},
        {$set: bedrock.db.buildUpdate(
          identity, 'identity', {exclude: [
            'identity.sysSlug', 'identity.sysStatus', 'identity.owner']})},
        bedrock.db.writeOptions,
        callback);
    },
    function(n, info, callback) {
      if(n === 0) {
        callback(new BedrockError(
          'Could not update Identity. Identity not found.',
          MODULE_NS + '.IdentityNotFound'));
      }
      else {
        callback();
      }
    }
  ], callback);
};

/**
 * Creates a PublicKeyId from the given IdentityId and key name.
 *
 * @param ownerId the identity ID of the owner of the key.
 * @param name the name of the key.
 *
 * @return the PublicKey ID created from the ownerId and keyName.
 */
api.createIdentityPublicKeyId = function(ownerId, name) {
  return util.format('%s/keys/%s', ownerId, encodeURIComponent(name));
};

/**
 * Adds a new PublicKey to the Identity.
 *
 * @param actor the Profile performing the action.
 * @param publicKey the publicKey to add, with no ID yet set.
 * @param privateKey the privateKey that is paired with the publicKey,
 *          only provided if it is to be stored on the server.
 * @param callback(err, record) called once the operation completes.
 */
api.addIdentityPublicKey = function(actor, publicKey) {
  var privateKey = null;
  var callback;
  if(arguments.length === 3) {
    callback = arguments[2];
  }
  else {
    privateKey = arguments[2];
    callback = arguments[3];
  }

  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, publicKey,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.PUBLIC_KEY_CREATE,
        api.checkIdentityObjectOwner, callback);
    },
    function(callback) {
      _addIdentityPublicKey(publicKey, privateKey, callback);
    }
  ], callback);
};

/**
 * Retrieves an Identity's PublicKey.
 *
 * @param publicKey the PublicKey with 'id' or both 'owner' and
 *          'publicKeyPem' set.
 * @param actor the Profile performing the action (if not undefined, an
 *          attempt to get the private key will also be made).
 * @param callback(err, publicKey, meta, privateKey) called once the
 *          operation completes.
 */
api.getIdentityPublicKey = function(publicKey, actor, callback) {
  if(typeof actor === 'function') {
    callback = actor;
    actor = undefined;
  }

  async.waterfall([
    function(callback) {
      var query = {};
      if('id' in publicKey) {
        query.id = bedrock.db.hash(publicKey.id);
      }
      else {
        query.owner = bedrock.db.hash(publicKey.owner);
        query.pem = bedrock.db.hash(publicKey.publicKeyPem);
      }
      bedrock.db.collections.publicKey.findOne(query, {}, callback);
    },
    function(record, callback) {
      // no such public key
      if(!record) {
        return callback(new BedrockError(
          'PublicKey not found.',
          MODULE_NS + '.PublicKeyNotFound',
          {key: publicKey}));
      }
      var privateKey = record.publicKey.privateKey || null;
      delete record.publicKey.privateKey;
      return callback(null, record.publicKey, record.meta, privateKey);
    },
    function(publicKey, meta, privateKey, callback) {
      if(actor === undefined) {
        return callback(null, publicKey, meta, privateKey);
      }
      bedrock.profile.checkActorPermissionForObject(
        actor, publicKey,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_ACCESS,
        api.checkIdentityObjectOwner, function(err) {
          if(err) {
            return callback(err);
          }
          else {
            callback(null, publicKey, meta, privateKey);
          }
        });
    }
  ], callback);
};

/**
 * Retrieves an Identity's PublicKey(s).
 *
 * @param id the ID of the identity to get the PublicKeys for.
 * @param actor the Profile performing the action (if not undefined, an
 *          attempt to get the private key will also be made).
 * @param callback(err, records) called once the operation completes.
 */
api.getIdentityPublicKeys = function(id, actor, callback) {
  if(typeof actor === 'function') {
    callback = actor;
    actor = undefined;
  }

  async.waterfall([
    function(callback) {
      bedrock.db.collections.publicKey.find(
        {owner: bedrock.db.hash(id)}, {}).toArray(callback);
    },
    function(records, callback) {
      if(actor === undefined) {
        return callback(null, records);
      }
      bedrock.profile.checkActorPermissionForObject(
        actor, {id: id},
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_ACCESS,
        api.checkIdentityOwner, function(err) {
          if(err) {
            return callback(err);
          }
          else {
            callback(null, records);
          }
        });
    },
    function(records, callback) {
      // remove private keys if no actor was provided
      if(actor === undefined) {
        records.forEach(function(record) {
          delete record.publicKey.privateKey;
        });
      }
      callback(null, records);
    }
  ], callback);
};

/**
 * Updates descriptive data for a PublicKey.
 *
 * @param actor the Profile performing the action.
 * @param publicKey the publicKey to update.
 * @param callback(err) called once the operation completes.
 */
api.updateIdentityPublicKey = function(actor, publicKey, callback) {
  async.waterfall([
    function(callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, publicKey,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.IDENTITY_EDIT,
        api.checkIdentityObjectOwner, callback);
    },
    function(callback) {
      // exclude restricted fields
      bedrock.db.collections.publicKey.update(
        {id: bedrock.db.hash(publicKey.id)},
        {$set: bedrock.db.buildUpdate(
          publicKey, 'publicKey', {exclude: [
            'publicKey.sysStatus', 'publicKey.publicKeyPem',
            'publicKey.owner']})},
        bedrock.db.writeOptions,
        callback);
    },
    function(n, info, callback) {
      if(n === 0) {
        callback(new BedrockError(
          'Could not update public key. Public key not found.',
          MODULE_NS + '.PublicKeyNotFound'));
      }
      else {
        callback();
      }
    }
  ], callback);
};

/**
 * Removes a PublicKey.
 *
 * @param actor the Profile performing the action.
 * @param publicKeyId the ID of the publicKey to revoke.
 * @param callback(err, key) called once the operation completes.
 */
api.revokeIdentityPublicKey = function(actor, publicKeyId, callback) {
  async.waterfall([
    function(callback) {
      api.getIdentityPublicKey({id: publicKeyId}, function(err, key) {
        callback(err, key);
      });
    },
    function(key, callback) {
      bedrock.profile.checkActorPermissionForObject(
        actor, key,
        PERMISSIONS.IDENTITY_ADMIN, PERMISSIONS.PUBLIC_KEY_REMOVE,
        api.checkIdentityObjectOwner, function(err) {
          callback(err, key);
        });
    },
    function(key, callback) {
      // set status to disabled, add revocation date
      key.sysStatus = 'disabled';
      key.revoked = bedrock.tools.w3cDate();
      bedrock.db.collections.publicKey.update(
        {id: bedrock.db.hash(publicKeyId), 'publicKey.sysStatus': 'active'},
        {$set: {
          'publicKey.sysStatus': key.sysStatus,
          'publicKey.revoked': key.revoked
        }},
        bedrock.db.writeOptions, function(err, n) {
          callback(err, n, key);
        });
    },
    function(n, key, callback) {
      if(n === 0) {
        return callback(new BedrockError(
          'Could not revoke public key. Public key not found or already ' +
          'revoked.', MODULE_NS + '.PublicKeyNotFound'));
      }
      callback(null, key);
    }
  ], callback);
};

/**
 * Checks if an actor owns an identity.
 *
 * @param actor the actor to compare against.
 * @param identity the identity to compare.
 * @param callback(err, owns) called once the operation completes.
 */
api.checkIdentityOwner = function(actor, identity, callback) {
  async.waterfall([
    function(callback) {
      if('owner' in identity) {
        return callback(null, identity);
      }
      api.getIdentity(actor, identity.id, function(err, identity) {
        callback(err, identity);
      });
    },
    function(identity, callback) {
      callback(null, actor.id === identity.owner);
    }
  ], callback);
};

/**
 * Checks if an actor owns an identity that owns another object.
 *
 * @param actor the actor to compare against.
 * @param object the object to compare.
 * @param callback(err, owns) called once the operation completes.
 */
api.checkIdentityObjectOwner = function(actor, object, callback) {
  api.checkIdentityOwner(actor, {id: object.owner}, callback);
};

/**
 * Creates a new identity, inserting it into the database.
 *
 * @param identity the identity to create.
 * @param callback(err, record) called once the operation completes.
 */
function _createIdentity(identity, callback) {
  bedrock.logger.info('creating identity', identity);

  var defaults = bedrock.config.identity.defaults;

  // add identity defaults
  if(identity.type === 'PersonalIdentity') {
    identity = bedrock.tools.extend(
      true, {}, defaults.personal, identity);
  }
  else {
    identity = bedrock.tools.extend(
      true, {}, defaults.identity, identity);
  }

  // create identity ID from slug if not present
  if(!('id' in identity)) {
    identity.id = api.createIdentityId(identity.sysSlug);
  }

  // insert the identity
  var now = Date.now();
  var record = {
    id: bedrock.db.hash(identity.id),
    owner: bedrock.db.hash(identity.owner),
    meta: {
      created: now,
      updated: now
    },
    identity: identity
  };
  bedrock.db.collections.identity.insert(
    record, bedrock.db.writeOptions, function(err, records) {
      if(err) {
        return callback(err);
      }
      callback(null, records[0]);
    });
}

/**
 * Adds a public key to an identity, inserting it into the database.
 *
 * @param publicKey the PublicKey to insert.
 * @param privateKey optional private key.
 * @param callback(err, record) called once the operation completes.
 */
function _addIdentityPublicKey(publicKey) {
  bedrock.logger.debug('adding public key', publicKey);

  var privateKey = null;
  var callback;
  if(arguments.length === 2) {
    callback = arguments[1];
  }
  else {
    privateKey = arguments[1];
    callback = arguments[2];
  }

  async.waterfall([
    function(callback) {
      // load and verify keypair
      var keypair = {
        publicKey: ursa.createPublicKey(publicKey.publicKeyPem, 'utf8'),
        privateKey: (privateKey ?
          ursa.createPrivateKey(privateKey.privateKeyPem, 'utf8') : null)
      };
      if(keypair.publicKey === null) {
        return callback(new BedrockError(
          'Could not add public key to Identity. Invalid public key.',
          MODULE_NS + '.InvalidPublicKey'));
      }
      if(privateKey && keypair.privateKey === null) {
        return callback(new BedrockError(
          'Could not add private key to Identity. Invalid private key.',
          MODULE_NS + '.InvalidPrivateKey'));
      }
      if(privateKey) {
        var ciphertext = keypair.publicKey.encrypt('plaintext', 'utf8');
        var plaintext = keypair.privateKey.decrypt(
          ciphertext, 'binary', 'utf8');
        if(plaintext !== 'plaintext') {
          return callback(new BedrockError(
            'Could not add public key to Identity. Key pair does not match.',
            MODULE_NS + '.InvalidKeyPair'));
        }
      }
      callback();
    },
    function(callback) {
      // id provided, skip public key ID generation
      if('id' in publicKey) {
        return callback(null, null);
      }

      // get next public key ID from identity meta
      // FIXME: ensure query contains shard key for findAndModify
      bedrock.db.collections.identity.findAndModify(
        {id: bedrock.db.hash(publicKey.owner)},
        [['id', 'asc']],
        {$inc: {'meta.lastPublicKeyId': 1}},
        bedrock.tools.extend(
          {}, bedrock.db.writeOptions,
          {upsert: true, 'new': true, fields: {'meta.lastPublicKeyId': true}}),
        function(err, record) {
          callback(err, record);
        });
    },
    function(record, callback) {
      // set default status
      if(!('sysStatus' in publicKey)) {
        publicKey.sysStatus = 'active';
      }

      // if no ID was provided, get last public key ID and update it
      if(!('id' in publicKey)) {
        publicKey.id = api.createIdentityPublicKeyId(
          publicKey.owner, record.meta.lastPublicKeyId);

        // if no label was provided, add default label
        if(!('label' in publicKey)) {
          publicKey.label = util.format(
            'Key %d', record.meta.lastPublicKeyId);
        }
      }

      // add private key if given
      if(privateKey) {
        publicKey = bedrock.tools.clone(publicKey);
        publicKey.privateKey = privateKey;
      }

      // insert the publc key
      var now = Date.now();
      var record = {
        id: bedrock.db.hash(publicKey.id),
        owner: bedrock.db.hash(publicKey.owner),
        pem: bedrock.db.hash(publicKey.publicKeyPem),
        meta: {
          created: now,
          updated: now
        },
        publicKey: publicKey
      };
      bedrock.db.collections.publicKey.insert(
        record, bedrock.db.writeOptions, function(err, records) {
          if(err) {
            return callback(err);
          }
          callback(null, records[0]);
        });
    }
  ], callback);
}

/**
 * Registers the permissions for this module.
 *
 * @param callback(err) called once the operation completes.
 */
function _registerPermissions(callback) {
  var permissions = [{
    id: PERMISSIONS.IDENTITY_ADMIN,
    label: 'Identity Administration',
    comment: 'Required to administer Identities.'
  }, {
    id: PERMISSIONS.IDENTITY_ACCESS,
    label: 'Access Identity',
    comment: 'Required to access an Identity.'
  }, {
    id: PERMISSIONS.IDENTITY_CREATE,
    label: 'Create Identity',
    comment: 'Required to create an Identity.'
  }, {
    id: PERMISSIONS.IDENTITY_EDIT,
    label: 'Edit Identity',
    comment: 'Required to edit an Identity.'
  }, {
    id: PERMISSIONS.IDENTITY_REMOVE,
    label: 'Remove Identity',
    comment: 'Required to remove an Identity.'
  }, {
    id: PERMISSIONS.PUBLIC_KEY_CREATE,
    label: 'Create Public Key',
    comment: 'Required to create a Public Key.'
  }, {
    id: PERMISSIONS.PUBLIC_KEY_REMOVE,
    label: 'Remove Public Key',
    comment: 'Required to remove a Public Key.'
  }];
  async.forEach(permissions, function(p, callback) {
    bedrock.permission.registerPermission(p, callback);
  }, callback);
}
