/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var _ = require('underscore');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.permission';

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
  // log permissions
  var permissions = bedrock.config.permission.permissions;
  Object.keys(permissions).forEach(function(permission) {
    bedrock.logger.debug('adding permission', permissions[permission]);
  });
  // log roles
  var roles = bedrock.config.permission.roles;
  Object.keys(roles).forEach(function(role) {
    bedrock.logger.debug('adding role', roles[role]);
  });
  callback();
};

/**
 * Creates a permission table using the given ResourceRole. A permission table
 * maps permissions and resource identifiers to true/undefined values and can
 * be used for quick look ups to determine if a particular permission is
 * granted for a particular resource.
 *
 * A ResourceRole is the combination of a Role and a set of resource
 * identifiers, eg:
 *
 * [{
 *   sysRole: 'admin',
 *   resource: ['https://example.com/i/foo']
 * }]
 *
 * If no resource is specified, then the role applies to all resources.
 * Resource identifiers are usually Identity IDs and are used to aggregate
 * permission checks on owned resources, but special cases may involve
 * IDs for other types of resources.
 *
 * @param resourceRoles the ResourceRoles to use.
 *
 * @return the permission table.
 */
api.createPermissionTable = function(resourceRoles) {
  var roles = bedrock.config.permission.roles;
  var table = {};
  resourceRoles.forEach(function(resourceRole) {
    if(resourceRole.sysRole in roles) {
      roles[resourceRole.sysRole].sysPermission.forEach(function(permission) {
        if(!resourceRole.resource) {
          table[permission] = true;
        }
        else if(!table[permission] || typeof table[permission] === 'object') {
          var resource = resourceRole.resource;
          if(!Array.isArray(resource)) {
            resource = [resource];
          }
          if(!table[permission]) {
            table[permission] = {};
          }
          resource.forEach(function(id) {
            table[permission][id] = true;
          });
        }
      });
    }
  });
  return table;
};

/**
 * Checks a permission table to see if the given permission(s) are granted.
 * Permission may also be checked against a particular resource or a set of
 * resources.
 *
 * A permission table usually belongs to an 'actor'; that actor is typically
 * attempting to perform an action on some resource(s). Permission can be
 * checked against one or more resources, which may be the resources (or
 * their identifiers) themselves, or they may be the product of some
 * higher-level abstraction. For example, permissions for certain resources may
 * be implemented by testing to see if a permission is granted for the Identity
 * that owns those resource(s). This approach allows common actions to be
 * aggregated and simplifies permission checks.
 *
 * By default, any resources given will be checked against the permission
 * table, however, a 'translate' function may be provided to convert those
 * resources into another set of identifiers to check instead. If translate
 * is given as an array of properties, then the resources will be translated
 * using the 'resourceToPropertyIdentifier' translation function.
 *
 * If the permission check passes, then an array of identifiers that passed
 * the check will be returned in the callback, otherwise an error will be
 * raised.
 *
 * @param table the permission table to check.
 * @param permission the permission to check.
 * @param options the options to use.
 *          [returnIds] true to return the identifiers that were checked
 *            and passed the check in the callback, false or omit not to.
 *          [resource] the resource to check.
 *          [or] a list of resources to check where, if any pass the check,
 *            an error is not raised.
 *          [and] a list of resources to check where, if any do not pass the
 *            check, an error is raised.
 *          [translate](resources, options, callback(err, identifiers)) either
 *            a function to map the given resources to a list of identifiers to
 *            check instead, or an array of properties to obtain the
 *            identifiers for any resources that are objects.
 *          [get](resource, callback) a function used to populate a resource
 *            if it is missing any of the translate properties.
 * @param callback(err, [identifiers]) called once the operation completes.
 */
api.checkPermission = function(table, permission, options, callback) {
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }

  // use permission ID if full permission given
  if(typeof permission === 'object') {
    permission = permission.id;
  }

  // options don't matter, permission granted for all resources
  if(table[permission] === true) {
    if(options.returnIds) {
      return callback(null, []);
    }
    return callback(null);
  }

  // permission denied; general permission not given and no resources passed
  if(!options.resource && !options.or && !options.and) {
    return callback(_resourcePermissionError(permission, 'Permission denied.'));
  }

  // get resources to check
  var resources = options.resource || options.or || options.and;

  // identifier map must exist if resources given
  if(typeof table[permission] !== 'object') {
    return callback(_resourcePermissionError(permission));
  }

  async.auto({
    translate: function(callback) {
      // translate resources to a list of identifiers
      var translate = options.translate || api.resourceToIdentifier;
      translate(resources, options, callback);
    },
    check: ['translate', function(callback, results) {
      var identifiers = results.translate;
      var passed = [];
      for(var i = 0; i < identifiers.length; ++i) {
        if(table[permission][identifiers[i]]) {
          passed.push(identifiers[i]);
        }
        // all identifiers must pass
        else if(options.and) {
          return callback(_resourcePermissionError(permission));
        }
      }
      if(passed.length > 0) {
        return callback(null, passed);
      }
      callback(_resourcePermissionError(permission));
    }]
  }, function(err, results) {
    if(options.returnIds) {
      return callback(err, results.check);
    }
    callback(err);
  });
};

/**
 * Creates an identifier translator function that translates resources to
 * an array of identifiers found via certain properties in each resource. If
 * any resource is only its identifier (it is a string) and the 'id' property
 * was given, then it will be used as the 'id' value. If the 'id' property
 * was not given, an error will be raised.
 *
 * @param properties the list of properties to use (can be a single property).
 *
 * @return the identifier translator function for use with 'checkPermission'.
 */
api.resourceToPropertyIdentifier = function(properties) {
  return function(resources, options, callback) {
    // normalize to array
    if(!Array.isArray(resources)) {
      resources = [resources];
    }
    if(!Array.isArray(properties)) {
      properties = [properties];
    }
    var hasId = (properties.indexOf('id') !== -1);
    var identifiers = [];

    // process each resource
    return async.forEach(resources, function(resource, next) {
      // populate resource if necessary
      if(options.get &&
        ((typeof resource === 'string' && (!hasId || properties.length > 1)) ||
        (bedrock.tools.isObject(resource) &&
        _.intersection(Object.keys(resource), properties).length !==
        properties.length))) {
        return options.get(resource, options, function(err, resource) {
          if(err) {
            return next(new BedrockError(
              'Permission denied; resource does not contain the ' +
              'required properties.',
              MODULE_NS + '.PermissionDenied',
              {public: true}, err));
          }
          translate(resource, next);
        });
      }
      // no population needed
      translate(resource, next);
    }, function(err) {
      callback(err, identifiers);
    });

    // translates a resource to a list of identifiers and adds them
    function translate(resource,  callback) {
      var ids = [];

      // pick out identifiers from resource properties
      if(bedrock.tools.isObject(resource)) {
        // pick out values for the given properties, flatten them to
        // a single array, and convert objects to their identifiers
        var values = _.flatten(_.values(_.pick(resource, properties)));
        values = values.map(function(x) {
          if(typeof x === 'string') {
            return x;
          }
          if(bedrock.tools.isObject(x)) {
            return x.id || null;
          }
          return null;
        });
        // filter values to valid IDs (remove any nulls)
        ids = _.filter(values, function(x) {
          return x !== null;
        });
      }
      else if(typeof resource === 'string' && hasId) {
        ids.push(resource);
      }

      if(ids.length === 0) {
        return callback(new BedrockError(
          'Permission denied; resource does not contain the ' +
          'required properties.',
          MODULE_NS + '.PermissionDenied',
          {public: true, httpStatusCode: 403}));
      }
      identifiers.push.apply(identifiers, ids);
      callback();
    }
  };
};

/**
 * Helper function that only checks for the 'id' property in resources.
 */
api.resourceToIdentifier = api.resourceToPropertyIdentifier('id');

/**
 * Helper function to generate a resource permission error.
 *
 * @param permission the permission that failed.
 * @param message optional custom error message.
 *
 * @return a resource permission error.
 */
function _resourcePermissionError(permission, message) {
  message = (message ||
    'Permission to interact with the given resource(s) has been denied.');
  return new BedrockError(
    message, MODULE_NS + '.PermissionDenied',
    {sysPermission: permission, public: true, httpStatusCode: 403});
}
