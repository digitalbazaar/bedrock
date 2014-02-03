/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  events: require('./events'),
  logger: require('./loggers').get('app'),
  mail: require('./mail'),
  permission: require('./permission'),
  security: require('./security'),
  tools: require('./tools')
};
var util = require('util');
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.profile';

// module permissions
var PERMISSIONS = {
  PROFILE_ADMIN: MODULE_NS + '.permission.profile_admin',
  PROFILE_ACCESS: MODULE_NS + '.permission.profile_access',
  PROFILE_CREATE: MODULE_NS + '.permission.profile_create',
  PROFILE_EDIT: MODULE_NS + '.permission.profile_edit',
  PROFILE_REMOVE: MODULE_NS + '.permission.profile_remove'
};

// module API
var api = {};
api.name = MODULE_NS;
module.exports = api;

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
      bedrock.db.openCollections(['profile'], callback);
    },
    function(callback) {
      // setup collections (create indexes, etc)
      bedrock.db.createIndexes([{
        collection: 'profile',
        fields: {id: 1},
        options: {unique: true, background: false}
      }, {
        collection: 'profile',
        fields: {'profile.sysSlug': 1},
        options: {unique: true, background: false}
      }, {
        collection: 'profile',
        fields: {'profile.email': 1},
        options: {unique: false, background: false}
      }], callback);
    },
    _registerPermissions,
    function(callback) {
      // create profiles, ignoring duplicate errors
      async.forEachSeries(
        bedrock.config.profile.profiles,
        function(p, callback) {
          _createProfile(p, function(err) {
            if(err && bedrock.db.isDuplicateError(err)) {
              err = null;
            }
            callback(err);
          });
        }, callback);
    },
    function(callback) {
      bedrock.mail.registerTrigger('fetchProfile', function(event, callback) {
        api.getProfile(
          null, event.details.profileId, function(err, profile) {
            if(!err) {
              event.details.profile = profile;
            }
            callback(err);
          });
        });
      callback();
    }
  ], callback);
};

/**
 * Creates a Profile ID from the given profilename (slug).
 *
 * @param name the profilename (slug).
 *
 * @return the Profile ID for the Profile.
 */
api.createProfileId = function(name) {
  return util.format('%s%s/%s',
    bedrock.config.server.baseUri,
    bedrock.config.profile.basePath,
    encodeURIComponent(name));
};

/**
 * Gets the Profile ID(s) that match the given email address.
 *
 * @param email the email address.
 * @param callback(err, profileIds) called once the operation completes.
 */
api.resolveEmail = function(email, callback) {
  bedrock.db.collections.profile.find(
    {'profile.email': email},
    {'profile.id': true}).toArray(function(err, records) {
    if(records) {
      records.forEach(function(record, i) {
        records[i] = record.profile.id;
      });
    }
    callback(err, records);
  });
};

/**
 * Gets the Profile ID that matches the given profilename (slug). The Profile
 * ID will be null if none is found. If a full profile ID is passed, it will
 * be passed back in the callback if it is valid.
 *
 * @param name the profilename (slug).
 * @param callback(err, profileId) called once the operation completes.
 */
api.resolveProfilename = function(name, callback) {
  bedrock.db.collections.profile.findOne(
    {$or: [{id: bedrock.db.hash(name)}, {'profile.sysSlug': name}]},
    {'profile.id': true},
    function(err, result) {
      if(!err && result) {
        result = result.profile.id;
      }
      callback(err, result);
    });
};

/**
 * Gets the Profile IDs that match the given identifier. The identifier
 * can be an Identity ID, a full Profile ID, a profilename (slug), or
 * an email address.
 *
 * @param identifier the identifier to resolve.
 * @param callback(err, profileIds) called once the operation completes.
 */
api.resolveProfileIdentifier = function(identifier, callback) {
  // looks like an email
  if(identifier.indexOf('@') !== -1) {
    api.resolveEmail(identifier, callback);
  }
  // must be an identity or profilename
  else {
    // give identity precedence
    bedrock.identity = require('./identity');
    bedrock.identity.getIdentities(
      null, {'identity.sysSlug': identifier}, {'identity.owner': true},
      function(err, records) {
        if(err) {
          return callback(err);
        }
        if(records.length === 0) {
          // look up profilename
          return api.resolveProfilename(identifier, function(err, result) {
            if(err) {
              return callback(err);
            }
            if(result) {
              // arrayify result
              return callback(null, [result]);
            }
            callback(null, []);
          });
        }

        // one result
        callback(null, [records[0].identity.owner]);
      });
  }
};

/**
 * Creates a new Profile.
 *
 * The Profile must contain id, a profilename (slug), and an email address.
 *
 * The Profile may contain a password and a set of Roles.
 *
 * @param actor the Profile performing the action.
 * @param profile the Profile containing at least the minimum required data.
 * @param callback(err, record) called once the operation completes.
 */
api.createProfile = function(actor, profile, callback) {
  async.waterfall([
    function(callback) {
      api.checkActorPermission(
        actor, PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_CREATE, callback);
    },
    function(callback) {
      _createProfile(profile, callback);
    }
  ], callback);
};

/**
 * Retrieves all Profiles matching the given query.
 *
 * @param actor the Profile performing the action.
 * @param [query] the optional query to use (default: {}).
 * @param [fields] optional fields to include or exclude (default: {}).
 * @param [options] options (eg: 'sort', 'limit').
 * @param callback(err, records) called once the operation completes.
 */
api.getProfiles = function(actor, query, fields, options, callback) {
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
      api.checkActorPermission(
        actor, PERMISSIONS.PROFILE_ADMIN, callback);
    },
    function(callback) {
      bedrock.db.collections.profile.find(
        query, fields, options).toArray(callback);
    }
  ], callback);
};

/**
 * Retrieves a Profile by its ID.
 *
 * @param actor the Profile performing the action.
 * @param id the ID of the Profile to retrieve.
 * @param callback(err, profile, meta) called once the operation completes.
 */
api.getProfile = function(actor, id, callback) {
  async.waterfall([
    function(callback) {
      api.checkActorPermissionForObject(
        actor, {id: id},
        PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_ACCESS, callback);
    },
    function(callback) {
      bedrock.db.collections.profile.findOne(
        {id: bedrock.db.hash(id)}, {}, callback);
    },
    function(record, callback) {
      if(!record) {
        return callback(new BedrockError(
          'Profile not found.',
          MODULE_NS + '.ProfileNotFound',
          {id: id}));
      }
      // remove restricted fields
      delete record.profile.sysPassword;
      delete record.profile.sysPasscode;
      callback(null, record.profile, record.meta);
    }
  ], callback);
};

/**
 * Updates a Profile. Only specific information contained in the passed
 * Profile will be updated. Restricted fields can not be updated in this
 * call, and may have their own API calls.
 *
 * @param actor the Profile performing the action.
 * @param profile the Profile to update.
 * @param callback(err) called once the operation completes.
 */
api.updateProfile = function(actor, profile, callback) {
  async.waterfall([
    function(callback) {
      api.checkActorPermissionForObject(
        actor, profile,
        PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_EDIT, callback);
    },
    function(callback) {
      // exclude restricted fields
      bedrock.db.collections.profile.update(
        {id: bedrock.db.hash(profile.id)},
        {$set: bedrock.db.buildUpdate(
          profile, 'profile', {exclude: [
            'profile.sysSlug', 'profile.sysPassword', 'profile.sysPasswordNew',
            'profile.sysPasscode', 'profile.sysRole', 'profile.sysStatus']})},
        bedrock.db.writeOptions,
        callback);
    },
    function(n, info, callback) {
      if(n === 0) {
        callback(new BedrockError(
          'Could not update Profile. Profile not found.',
          MODULE_NS + '.ProfileNotFound'));
      }
      else {
        callback();
      }
    }
  ], callback);
};

/**
 * Sets a Profile's status.
 *
 * @param actor the Profile performing the action.
 * @param id the Profile ID.
 * @param status the status.
 * @param callback(err) called once the operation completes.
 */
api.setProfileStatus = function(actor, id, status, callback) {
  async.waterfall([
   function(callback) {
     api.checkActorPermissionForObject(
       actor, {id: id},
       PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_EDIT, callback);
   },
   function(callback) {
     bedrock.db.collections.profile.update(
       {id: bedrock.db.hash(id)},
       {$set: {'profile.sysStatus': status}},
       bedrock.db.writeOptions,
       callback);
   },
   function(n, info, callback) {
     if(n === 0) {
       callback(new BedrockError(
         'Could not set Profile status. Profile not found.',
         MODULE_NS + '.ProfileNotFound'));
     }
     else {
       callback();
     }
   }
 ], callback);
};

/**
 * Sets a Profile's password. This method can optionally check an old password
 * or passcode and will always generate a new passcode and set it as
 * 'sysPasscode'. A new password doesn't have to be set using this method, it
 * can be called to simply generate a new passcode. If 'sysPassword' is
 * provided, it must be the old password and it will be checked. The same
 * applies to 'sysPasscode'. If a new password is to be set, it should be
 * passed as 'sysPasswordNew'.
 *
 * @param actor the Profile performing the action.
 * @param profile the Profile.
 * @param callback(err, changes) called once the operation completes.
 */
api.setProfilePassword = function(actor, profile, callback) {
  async.waterfall([
    function(callback) {
      api.checkActorPermissionForObject(
        actor, profile,
        PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_EDIT, callback);
    },
    function(callback) {
      _updateProfilePassword(profile, callback);
    },
    function(changes, callback) {
      bedrock.db.collections.profile.update(
        {id: bedrock.db.hash(profile.id)},
        {$set: bedrock.db.buildUpdate(changes, 'profile')},
        bedrock.db.writeOptions,
        function(err, n) {
          callback(err, n, changes);
        });
    },
    function(n, changes, callback) {
      if(n === 0) {
        return callback(new BedrockError(
          'Could not set Profile password. Profile not found.',
          MODULE_NS + '.ProfileNotFound'));
      }
      callback(null, changes);
    }
  ], callback);
};

/**
 * A helper function for updating Profile passwords and passcodes. The
 * profile will be updated with a new passcode.
 *
 * @see setProfilePassword
 *
 * @param profile the profile.
 * @param callback(err, changes) called once the operation completes.
 */
function _updateProfilePassword(profile, callback) {
  var changes = {};
  async.auto({
    checkPassword: function(callback) {
      if('sysPassword' in profile) {
        api.verifyProfilePassword(profile, callback);
      }
      else {
        callback(null, null);
      }
    },
    checkPasscode: function(callback) {
      if('sysPasscode' in profile) {
        api.verifyProfilePasscode(profile, callback);
      }
      else {
        callback(null, null);
      }
    },
    hashPassword: ['checkPassword', 'checkPasscode',
      function(callback, results) {
        if(results.checkPassword === false) {
          return callback(new BedrockError(
            'Could not update profile password; invalid password.',
            MODULE_NS + '.InvalidPassword'));
        }
        if(results.checkPasscode === false) {
          return callback(new BedrockError(
            'Could not update profile passcode; invalid passcode.',
            MODULE_NS + '.InvalidPasscode'));
        }

        if('sysPasswordNew' in profile) {
          bedrock.security.createPasswordHash(
            profile.sysPasswordNew, callback);
        }
        else {
          callback();
        }
    }],
    generatePasscode: ['hashPassword', function(callback, results) {
      if(results.hashPassword) {
        changes.sysPassword = results.hashPassword;
      }
      var passcode = profile.sysPasscode = _generatePasscode();
      bedrock.security.createPasswordHash(passcode, callback);
    }]
  }, function(err, results) {
    if(!err) {
      changes.sysPasscode = results.generatePasscode;
    }
    callback(err, changes);
  });
}

/**
 * Verifies the Profile's password against the stored password.
 *
 * @param profile the Profile with the password to verify.
 * @param callback(err, verified) called once the operation completes.
 */
api.verifyProfilePassword = function(profile, callback) {
  _verifyProfilePasswordHash(profile, 'password', callback);
};

/**
 * Verifies the Profile's passcode against the stored passcode.
 *
 * @param profile the Profile with the passcode to verify.
 * @param callback(err, verified) called once the operation completes.
 */
api.verifyProfilePasscode = function(profile, callback) {
  _verifyProfilePasswordHash(profile, 'passcode', callback);
};

/**
 * Verifies the Profile's passcode against the stored passcode and sets
 * the Profile's email address as verified upon success.
 *
 * @param actor the Profile performing the action.
 * @param profile the Profile with the passcode to verify.
 * @param callback(err, verified) called once the operation completes.
 */
api.verifyProfileEmail = function(actor, profile, callback) {
  async.waterfall([
    function(callback) {
      api.checkActorPermissionForObject(
        actor, profile,
        PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_EDIT, callback);
    },
    function(callback) {
      _verifyProfilePasswordHash(profile, 'passcode', callback);
    },
    function(verified, callback) {
      if(!verified) {
        return callback(null, verified);
      }

      bedrock.db.collections.profile.update(
        {id: bedrock.db.hash(profile.id)},
        {$set: {'profile.sysEmailVerified': true}},
        bedrock.db.writeOptions, function(err) {
          callback(err, verified);
      });
    }
  ], callback);
};

/**
 * A helper function for verifying passwords and passcodes.
 *
 * @param profile the profile with the password or passcode.
 * @param type 'password' or 'passcode'.
 * @param callback(err, verified) called once the operation completes.
 */
function _verifyProfilePasswordHash(profile, type, callback) {
  var field = 'sys' + type[0].toUpperCase() + type.substr(1);
  async.waterfall([
    function(callback) {
      // get status and <type> from db
      var fields = {'profile.sysStatus': true};
      fields['profile.' + field] = true;
      bedrock.db.collections.profile.findOne(
        {id: bedrock.db.hash(profile.id)}, fields, callback);
    },
    function(record, callback) {
      if(!record) {
        return callback(new BedrockError(
          'Could not verify Profile ' + type + '. Profile not found.',
          MODULE_NS + '.ProfileNotFound'));
      }
      if(record.profile.sysStatus !== 'active') {
        return callback(new BedrockError(
          'Could not verify Profile ' + type + '. Profile is not active.',
          MODULE_NS + '.ProfileInactive'));
      }
      callback(null, record.profile[field]);
    },
    function(hash, callback) {
      bedrock.security.verifyPasswordHash(hash, profile[field], callback);
    },
    function(verified, legacy) {
      if(!verified || !legacy) {
        return callback(null, verified);
      }

      // update legacy password
      bedrock.security.createPasswordHash(profile[field], function(err, hash) {
        var update = {$set: {}};
        update.$set['profile.' + field] = hash;
        bedrock.db.collections.profile.update(
          {id: bedrock.db.hash(profile.id)}, update,
          bedrock.db.writeOptions,
          function(err) {
            callback(err, verified);
          });
      });
      callback(null, verified);
    }
  ], callback);
}

/**
 * Sends a Profile or multiple Profile's passcodes to their contact point
 * (eg: email address). The Profiles must all have the same contact point and
 * must be populated.
 *
 * @param profiles the Profiles to send the passcode to.
 * @param usage 'reset' if the passcode is for resetting a password,
 *          'verify' if it is for verifying an email address/contact point.
 * @param callback(err) called once the operation completes.
 */
api.sendProfilePasscodes = function(profiles, usage, callback) {
  // FIXME: require actor and check permissions to send email/sms/etc?

  // create event
  var event = {
    type: 'common.Profile.passcodeSent',
    details: {
      usage: usage,
      profiles: [],
      email: null
    }
  };

  // lazy-load identity module
  if(!bedrock.identity) {
    bedrock.identity = require('./identity');
  }

  // generate passcodes for every profile
  async.forEach(profiles, function(profile, callback) {
    // remove password and passcode from profile; this prevents checking
    // passwords/passcodes and only generates a new passcode
    profile = bedrock.tools.clone(profile);
    delete profile.sysPassword;
    delete profile.sysPasscode;
    api.setProfilePassword(null, profile, function(err) {
      if(err) {
        return callback(err);
      }
      // get default profile identity
      bedrock.identity.getProfileDefaultIdentity(null, profile.id,
        function(err, identity) {
          // ignore identity not found errors for empty profiles
          if(err && err.name === 'bedrock.identity.IdentityNotFound') {
            err = null;
            identity = null;
          }
          if(err) {
            return callback(err);
          }
          profile.identity = identity;
          event.details.profiles.push(profile);
          if(!event.details.email) {
            event.details.email = profile.email;
          }
          else if(event.details.email !== profile.email) {
            return callback(new BedrockError(
              'Could not send Profile passcodes. The profiles do not all ' +
              'have the same contact point (eg: email address).',
              MODULE_NS + '.ContactPointMismatch'));
          }
          callback();
      });
    });
  }, function(err) {
    if(err) {
      return callback(err);
    }

    // emit passcode sent event
    bedrock.events.emit(event);
    // TODO: limit # emails sent per profile per day
    callback();
  });
};

/**
 * Sets the Profile's Roles from the profile['sysRole'] array of RoleIDs.
 *
 * @param actor the Profile performing the action.
 * @param profile the Profile that is being updated.
 * @param callback(err) called once the operation completes.
 */
api.setProfileRoles = function(actor, profile, callback) {
  async.waterfall([
    function(callback) {
      api.checkActorPermission(
        actor, PERMISSIONS.PROFILE_ADMIN, PERMISSIONS.PROFILE_CREATE, callback);
    },
    function(callback) {
      bedrock.db.collections.profile.update(
        {id: bedrock.db.hash(profile.id)},
        {$set: {'profile.sysRole': profile.sysRole}},
        bedrock.db.writeOptions,
        callback);
    }
  ], callback);
};

/**
 * Checks if the actor's Roles contain the necessary Permissions.
 *
 * The populated Roles will be cached in the Actor to make further
 * permission checks quicker.
 *
 * @param actor the Profile to check.
 * @param permissions the PermissionList to check.
 * @param callback(err) called once the operation completes.
 *
 * @return true if the actor has permission, false otherwise.
 */
api.checkActorPermissionList = function(actor, permissions, callback) {
  // if actor is null, ignore permission check
  if(actor === null) {
    return callback(null);
  }

  // use permission cache
  if('sysPermissionCache' in actor) {
    return bedrock.permission.checkPermission(
      actor.sysPermissionCache, permissions, callback);
  }

  // build permission cache
  async.waterfall([
    function(callback) {
      bedrock.db.collections.profile.findOne(
        {id: bedrock.db.hash(actor.id)},
        {'profile.sysRole': true},
        function(err, result) {
          if(err) {
            return callback(err);
          }
          if(!result) {
            result = [];
          }
          else {
            result = result.profile.sysRole;
          }
          _populateRoles(result, callback);
        });
    },
    function(roles, callback) {
      // create map of unique permissions
      var unique = {};
      roles.forEach(function(role) {
        role.sysPermission.forEach(function(permission) {
          unique[permission.id] = permission;
        });
      });

      // put unique permissions into cache
      actor.sysPermissionCache = [];
      for(var id in unique) {
        actor.sysPermissionCache.push(unique[id]);
      }
      callback();
    }
  ], function(err) {
    if(err) {
      return callback(err);
    }
    api.checkActorPermissionList(actor, permissions, callback);
  });
};

/**
 * A helper function for populating roles.
 *
 * @param roleIds the IDs of the roles to be populated.
 * @param callback(err, roles) called once the roles are populated.
 */
function _populateRoles(roleIds, callback) {
  bedrock.permission.getRoles(roleIds, callback);
}

/**
 * Checks if the actor's Roles contain the necessary Permissions.
 *
 * The populated Roles will be cached in the Actor to make further
 * permission checks quicker.
 *
 * This function can check an arbitrary list of permission ids.
 *
 * @param actor the Profile to check.
 * @param permission1 a permission id to check.
 * @param permissionN a permission id to check (optional).
 * @param callback(err) called once the operation completes.
 */
api.checkActorPermission = function(actor, permission1) {
  var permissions = [];
  var length = arguments.length;
  for(var i = 1; i < length - 1; ++i) {
    permissions.push({id: arguments[i]});
  }
  var callback = arguments[length - 1];
  api.checkActorPermissionList(actor, permissions, callback);
};

/**
 * Comparator callback that always signals an object is owned by an actor with
 * no actual checks.
 *
 * This callback is useful when using the other functions that do an object
 * check but the check is not needed.
 *
 * @param actor the Profile to check.
 * @param object the object used to check ownership.
 * @param callback(err, owns) called once the operation completes.
 */
api.actorAlwaysOwnsObjectComparator = function(actor, object, callback) {
  callback(null, true);
};

/**
 * Checks if the actor owns the given object.
 *
 * The populated Roles will be cached in the Actor to make further
 * permission checks quicker.
 *
 * @param actor the Profile to check.
 * @param object the object used to check ownership.
 * @param comparator(actor, object, callback(err, owns)) a function to
 *          determine if the actor owns the object, omit for simple "id"
 *          comparison.
 * @param callback(err) called once the operation completes.
 */
api.checkActorOwnsObject = function(actor, object) {
  var length = arguments.length;
  var comparator;
  var callback;
  if(length === 3) {
    comparator = function(actor, object, callback) {
      callback(null, actor.id === object.id);
    };
    callback = arguments[2];
  }
  else {
    comparator = arguments[2];
    callback = arguments[3];
  }
  comparator(actor, object, function(err, owns) {
    if(!err && !owns) {
      err = new BedrockError(
        'The actor does not have permission to interact with this object.',
        'bedrock.permission.PermissionDenied');
    }
    callback(err);
  });
};

/**
 * Checks if the actor's Roles contain the necessary Permissions.
 *
 * The populated Roles will be cached in the Actor to make further
 * permission checks quicker.
 *
 * This function handles the common case of checking that an actor has:
 *
 * 1. a normal permission, AND
 * 2. a special permission OR is the owner of the target object
 *
 * @param actor the Profile to check.
 * @param object the object used to check ownership.
 * @param permissionSpecial a special permission id to check.
 * @param permissionNormal a regular permission id to check.
 * @param comparator(actor, object, callback(err, owns)) a function to
 *          determine if the actor owns the object, omit for simple "id"
 *          comparison.
 * @param callback(err) called once the operation completes.
 */
api.checkActorPermissionForObject = function(
  actor, object, permissionSpecial, permissionNormal) {
  var length = arguments.length;
  var comparator;
  var callback;
  if(length === 6) {
    comparator = arguments[4];
    callback = arguments[5];
  }
  else {
    comparator = null;
    callback = arguments[4];
  }

  // if actor is null, ignore permission check
  if(actor === null) {
    return callback(null);
  }

  async.waterfall([
    function(callback) {
      api.checkActorPermission(actor, permissionNormal, callback);
    },
    function(callback) {
      api.checkActorPermission(actor, permissionSpecial, function(err) {
        // if special permission not granted, check object ownership
        if(err) {
          if(comparator) {
            api.checkActorOwnsObject(actor, object, comparator, callback);
          }
          else {
            api.checkActorOwnsObject(actor, object, callback);
          }
        }
        else {
          callback();
        }
      });
    }
  ], callback);
};

/**
 * Checks if the actor's Roles contain the necessary Permissions.
 *
 * The populated Roles will be cached in the Actor to make further
 * permission checks quicker.
 *
 * This function handles the common case of checking that an actor has:
 *
 * 1. a normal permission, OR
 * 2. a special permission
 *
 * @param actor the Profile to check.
 * @param permissionSpecial a special permission id to check.
 * @param permissionNormal a regular permission id to check.
 * @param callback(err) called once the operation completes.
 */
api.checkActorPermissionOrSpecial = function(
  actor, permissionSpecial, permissionNormal, callback) {
  api.checkActorPermissionForObject(
    actor, null, permissionSpecial, permissionNormal,
    api.actorAlwaysOwnsObjectComparator, callback);
};

// static passcode character set
var CHARSET = (
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz');

/**
 * Generates a passcode for resetting a password. This passcode must be
 * stored using a password hash in the database.
 *
 * @return the generated passcode.
 */
function _generatePasscode() {
  // passcodes are 8 chars long
  var rval = '';
  for(var i = 0; i < 8; ++i) {
    rval += CHARSET.charAt(parseInt(Math.random() * (CHARSET.length - 1), 10));
  }
  return rval;
}

/**
 * Creates a new profile, inserting it into the database. If the given profile
 * has no 'id' but has a 'sysSlug' property, then the 'id' will be generated
 * from 'sysSlug'. If there is no 'sysSlug' property, then a unique slug and
 * ID will be autogenerated for the profile before inserting it.
 *
 * @param profile the profile to create.
 * @param callback(err, record) called once the operation completes.
 */
function _createProfile(profile, callback) {
  async.waterfall([
    function(callback) {
      // check for a duplicate to prevent generating password hashes
      bedrock.db.collections.profile.findOne(
        {'profile.sysSlug': profile.sysSlug}, {'profile.sysSlug': true},
        function(err, record) {
          if(err) {
            return callback(err);
          }
          if(record) {
            // simulate duplicate profile error
            err = new Error('Duplicate Profile.');
            err.name = 'MongoError';
            err.code = 11000;
            return callback(err);
          }
          callback();
        });
    },
    function(callback) {
      bedrock.logger.debug('creating profile', profile);

      var defaults = bedrock.config.profile.defaults.profile;
      bedrock.tools.extend(profile, {
        label: profile.label || profile.sysSlug || null,
        sysStatus: profile.sysStatus || defaults.sysStatus,
        sysRole: profile.sysRole || defaults.sysRole
      });

      /* Note: If the profile doesn't have a password, generate a fake one
      for them (that will not be known by anyone). This simplifies the code
      path for verifying passwords. */
      if(!('sysPassword' in profile)) {
        profile.sysPassword = _generatePasscode();
      }

      // generate new random passcode for profile
      var passcode = _generatePasscode();

      async.auto({
        hashPassword: function(callback) {
          if(profile.sysHashedPassword === true) {
            // password already hashed
            delete profile.sysHashedPassword;
            callback(null, profile.sysPassword);
          }
          else {
            bedrock.security.createPasswordHash(profile.sysPassword, callback);
          }
        },
        hashPasscode: function(callback) {
          if(profile.sysHashedPasscode === true) {
            // passcode already hashed
            delete profile.sysHashedPasscode;
            callback(null, profile.sysPasscode);
          }
          else {
            bedrock.security.createPasswordHash(passcode, callback);
          }
        }
      }, function(err, results) {
        if(err) {
          return callback(err);
        }

        // store hash results
        profile.sysPassword = results.hashPassword;
        profile.sysPasscode = results.hashPasscode;

        // keep attempting to insert profile until a generated ID is unique or
        // an ID was given
        var result = null;
        var generateSlug = !profile.sysSlug;
        var setLabel = !profile.label;
        async.until(function() {return result !== null;}, function(callback) {
          // generate a new unique slug and ID using UUID
          if(generateSlug) {
            profile.sysSlug = bedrock.tools.uuid();
            delete profile.id;
          }

          // create profile ID from slug if not present
          if(!('id' in profile)) {
            profile.id = api.createProfileId(profile.sysSlug);
          }

          // default label to profile slug
          if(setLabel) {
            profile.label = profile.sysSlug;
          }

          // insert the profile
          var now = +new Date();
          var record = {
            id: bedrock.db.hash(profile.id),
            meta: {
              created: now,
              updated: now
            },
            profile: profile
          };
          bedrock.db.collections.profile.insert(
            record, bedrock.db.writeOptions, function(err, records) {
              if(err) {
                // try again if generating slug and ID was a duplicate
                if(generateSlug && bedrock.db.isDuplicateError(err)) {
                  return callback();
                }
                // return error
                return callback(err);
              }
              // return unhashed passcode, set result
              profile.sysPasscode = passcode;
              result = records[0];
              callback();
            });
        }, function(err) {
          callback(err, result);
        });
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
    id: PERMISSIONS.PROFILE_ADMIN,
    label: 'Profile Administration',
    comment: 'Required to administer Profiles.'
  }, {
    id: PERMISSIONS.PROFILE_ACCESS,
    label: 'Access Profile',
    comment: 'Required to access a Profile.'
  }, {
    id: PERMISSIONS.PROFILE_CREATE,
    label: 'Create Profile',
    comment: 'Required to create a Profile.'
  }, {
    id: PERMISSIONS.PROFILE_EDIT,
    label: 'Edit Profile',
    comment: 'Required to edit a Profile.'
  }, {
    id: PERMISSIONS.PROFILE_REMOVE,
    label: 'Remove Profile',
    comment: 'Required to remove a Profile.'
  }];
  async.forEach(permissions, function(p, callback) {
    bedrock.permission.registerPermission(p, callback);
  }, callback);
}
