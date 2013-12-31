/*!
 * Key Service.
 *
 * @author Dave Longley
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

var deps = ['$timeout', '$rootScope', 'svcModel', 'svcIdentity'];
return {svcKey: deps.concat(factory)};

function factory($timeout, $rootScope, svcModel, svcIdentity) {
  var service = {};

  var identity = svcIdentity.identity;
  var expires = 0;
  var maxAge = 1000*60*2;
  service.keys = [];
  service.state = {
    loading: false
  };

  // get all keys for an identity
  service.get = function(options, callback) {
    if(typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    callback = callback || angular.noop;

    if(options.force || +new Date() >= expires) {
      service.state.loading = true;
      $timeout(function() {
        bedrock.keys.get({
          identity: identity.id,
          success: function(keys) {
            expires = +new Date() + maxAge;
            svcModel.replaceArray(service.keys, keys);
            service.state.loading = false;
            callback(null, service.keys);
            $rootScope.$apply();
          },
          error: function(err) {
            service.state.loading = false;
            callback(err);
            $rootScope.$apply();
          }
        });
      }, options.delay || 0);
    }
    else {
      $timeout(function() {
        callback(null, service.keys);
      });
    }
  };

  // get a single key
  service.getOne = function(keyId, options, callback) {
    if(typeof options === 'function') {
      callback = options;
      options = {};
    }
    options = options || {};
    callback = callback || angular.noop;

    service.state.loading = true;
    $timeout(function() {
      bedrock.keys.getOne({
        key: keyId,
        success: function(key) {
          svcModel.replaceInArray(service.keys, key);
          service.state.loading = false;
          callback(null, key);
          $rootScope.$apply();
        },
        error: function(err) {
          service.state.loading = false;
          callback(err);
          $rootScope.$apply();
        }
      });
    }, options.delay || 0);
  };

  // update a key
  service.update = function(key, callback) {
    service.state.loading = true;
    bedrock.keys.update({
      key: key,
      success: function() {
        // get key
        service.getOne(key.id, callback);
      },
      error: function(err) {
        service.state.loading = false;
        callback(err);
        $rootScope.$apply();
      }
    });
  };

  // revoke a key
  service.revoke = function(key, callback) {
    callback = callback || angular.noop;
    service.state.loading = true;
    bedrock.keys.revoke({
      key: key.id,
      success: function(key) {
        service.state.loading = false;
        svcModel.replaceInArray(service.keys, key);
        callback(null, key);
        $rootScope.$apply();
      },
      error: function(err) {
        service.state.loading = false;
        callback(err);
        $rootScope.$apply();
      }
    });
  };

  return service;
}

});
