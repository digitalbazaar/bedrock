/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.permission';

// module permissions
var PERMISSIONS = {
  ROLE_ADMIN: MODULE_NS + '.permission.role_admin',
  ROLE_EDIT: MODULE_NS + '.permission.role_edit',
  ROLE_REMOVE: MODULE_NS + '.permission.role_remove'
};

// module API
var api = {};
api.name = MODULE_NS;
module.exports = api;

// cache of registered permissions
var registeredPermissions = {
  map: {},
  list: []
};

// loaded roles
var roles = {};

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    _registerPermissions,
    function(callback) {
      // add roles, ignoring duplicates
      async.forEachSeries(
        bedrock.config.permission.roles,
        function(r, callback) {
          api.addRole(r, function(err) {
            if(err && err.name === MODULE_NS + '.DuplicateError') {
              err = null;
            }
            callback(err);
          });
        }, callback);
    }
  ], callback);
};

/**
 * Registers the Permission with the system so it can be added to Roles.
 *
 * @param permission the Permission to register.
 * @param callback(err) called once the operation completes.
 */
api.registerPermission = function(permission, callback) {
  bedrock.logger.debug('registering permission', permission);

  async.waterfall([
    function(callback) {
      // validate permission
      //bedrock.validation.permission.isValid(permission, callback);
      callback();
    },
    function(callback) {
      var list = registeredPermissions.list;
      var map = registeredPermissions.map;
      var id = permission.id;
      if(id in map) {
        // update permission
        list[map[id]] = permission;
      }
      else {
        // add new permission
        map[id] = list.length;
        list.push(permission);
      }
      callback();
    }
  ], callback);
};

/**
 * Retrieves all Permissions currently registered in the system.
 *
 * @return a clone of the list of Permissions registered in the system.
 */
api.getRegisteredPermissions = function() {
  return bedrock.tools.clone(registeredPermissions.list);
};

/**
 * Adds a new Role to the system.
 *
 * @param role the Role to add.
 * @param callback(err) called once the operation completes.
 */
api.addRole = function(role, callback) {
  bedrock.logger.debug('adding role', role);

  if(role.id in roles) {
    return callback(new BedrockError(
      'Could not add role; the role already exists.',
      MODULE_NS + '.DuplicateError', {id: role.id}));
  }

  roles[role.id] = role;
  callback();
};

/**
 * Retrieves all Roles that match the given Role IDs.
 *
 * @param ids the IDs to fetch.
 * @param callback(err, roles) called once the operation completes.
 */
api.getRoles = function(ids, callback) {
  var results = [];
  ids.forEach(function(id) {
    if(id in roles) {
      results.push(roles[id]);
    }
  });
  callback(null, results);
};

/**
 * Retrieves a single Role.
 *
 * @param id the ID of the Role to retrieve.
 *
 * @return the role or null if it does not exist.
 */
api.getRole = function(id) {
  return roles[id] || null;
};

/**
 * Updates a Role. Sets the label, comment, and permissions for the role.
 *
 * @param actor the Profile performing the action.
 * @param role the Role to update.
 * @param callback(err) called once the operation completes.
 */
api.updateRole = function(actor, role, callback) {
  var profile = require('./profile');
  async.waterfall([
    function(callback) {
      profile.checkActorPermission(
        actor, PERMISSIONS.ROLE_ADMIN, PERMISSIONS.ROLE_EDIT, callback);
    },
    function(callback) {
      if(!(role.id in roles)) {
        return callback(new BedrockError(
          'Could not update Role. Role not found.',
          MODULE_NS + '.RoleNotFound'));
      }

      // copy role to make changes atomically
      var copy = bedrock.tools.clone(roles[role.id]);
      if('label' in role) {
        copy.label = role.label;
      }
      if('comment' in role) {
        copy.comment = role.comment;
      }
      if('sysPermission' in role) {
        copy.sysPermission = role.sysPermission;
      }
      roles[role.id] = copy;
      callback();
    }
  ], callback);
};

/**
 * Removes a Role from the system.
 *
 * Warning: This may leave data that depends on Roles that do not exist.
 *
 * @param actor the Profile performing the action.
 * @param id the ID of the Role to remove.
 * @param callback(err) called once the operation completes.
 */
api.removeRole = function(actor, id, callback) {
  var profile = require('./profile');
  async.waterfall([
    function(callback) {
      profile.checkActorPermission(
        actor, PERMISSIONS.ROLE_ADMIN, PERMISSIONS.ROLE_REMOVE, callback);
    },
    function(callback) {
      delete roles[id];
      callback();
    }
  ], callback);
};

/**
 * Checks if the first PermissionList has a superset of the permissions in
 * second PermissionList.
 *
 * @param superset the PermissionList to check against.
 * @param subset the PermissionList of permissions to check.
 * @param callback(err) called once the operation completes.
 */
api.checkPermission = function(superset, subset, callback) {
  async.waterfall([
    function(callback) {
      // FIXME: validate superset
      //bedrock.validation.permissionList.isValid(superset, callback);
      callback();
    },
    function(callback) {
      // FIXME: validate subset
      //bedrock.validation.permissionList.isValid(subset, callback);
      callback();
    },
    function(callback) {
      // build superset map
      var map = {};
      superset.forEach(function(permission) {
        map[permission.id] = permission;
      });

      // create denied permission list
      var denied = [];

      // check subset against superset
      subset.forEach(function(permission) {
        if(!(permission.id in map)) {
          denied.push(bedrock.tools.clone(permission));
        }
      });

      if(denied.length > 0) {
        return callback(new BedrockError(
          'Permission denied.',
          MODULE_NS + '.PermissionDenied', {denied: denied}));
      }
      callback();
    }
  ], callback);
};

/**
 * Checks if the Role has all of the permissions.
 *
 * @param role the Role to check.
 * @param permissions the PermissionList of permissions to check.
 * @param callback(err) called once the operation completes.
 */
api.checkRolePermission = function(role, permissions, callback) {
  async.waterfall([
    function(callback) {
      // FIXME: validate role
      //bedrock.validation.role.isValid(role, callback);
      callback();
    },
    function(callback) {
      // FIXME: validate list
      //bedrock.validation.permissionList.isValid(permissions, callback);
      callback();
    },
    function(callback) {
      api.checkPermission(role.sysPermission, permissions, callback);
    }
  ], callback);
};

/**
 * Registers the permissions for this module.
 *
 * @param callback(err) called once the operation completes.
 */
function _registerPermissions(callback) {
  var permissions = [{
    id: PERMISSIONS.ROLE_ADMIN,
    label: 'Role Administration',
    comment: 'Required to administer Roles.'
  }, {
    id: PERMISSIONS.ROLE_ACCESS,
    label: 'Access Role',
    comment: 'Required to access a Role.'
  }, {
    id: PERMISSIONS.ROLE_CREATE,
    label: 'Create Role',
    comment: 'Required to create a Role.'
  }, {
    id: PERMISSIONS.ROLE_EDIT,
    label: 'Edit Role',
    comment: 'Required to edit a Role.'
  }, {
    id: PERMISSIONS.ROLE_REMOVE,
    label: 'Remove Role',
    comment: 'Required to remove a Role.'
  }];
  async.forEach(permissions, function(p, callback) {
    api.registerPermission(p, callback);
  }, callback);
}
