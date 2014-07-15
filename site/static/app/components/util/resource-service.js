/*!
 * Resource Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author David I. Lehn
 * @author Dave Longley
 */
define(['underscore'], function(_) {

'use strict';

/* @ngInject */
function factory($rootScope, $http, $location, ModelService) {
  var service = {};

  // create a new collection
  // config: {
  //   url: url to collection (string)
  //   storage: reference to external array of data (optional)
  //   expires: time data expires (timestamp, optional [0])
  //   maxAge: maximum cache age (ms, optional [2m])
  //   query: default params object to use for getAll() (optional)
  //   finishLoading: custom callback to call after every load (fn, optional)
  // }
  service.Collection = function(config) {
    this.config = config || {};
    this.storage = config.storage || [];
    this.expires = config.expires || 0;
    this.maxAge = config.maxAge || (1000 * 60 * 2);

    this.loadingCount = 0;
    this.state = {
      loading: false
    };
  };

  service.Collection.prototype.startLoading = function(count) {
    count = count || 1;
    this.loadingCount = this.loadingCount + count;
    this.state.loading = true;
  };

  service.Collection.prototype.finishLoading = function(count) {
    count = count || 1;
    this.loadingCount = this.loadingCount - count;
    this.state.loading = (this.loadingCount !== 0);
    if(this.config.finishLoading) {
      return Promise.resolve(this.config.finishLoading());
    }
    return Promise.resolve();
  };

  // get all collection resources
  service.Collection.prototype.getAll = function(options) {
    var self = this;
    options = options || {};
    if(Date.now() < self.expires && !options.force) {
      return Promise.resolve(self.storage);
    }
    self.startLoading();
    var config = self._buildConfig(options);
    var url = _getUrl(self.config, 'getAll');
    return Promise.resolve($http.get(url, config))
      .then(function(response) {
        // update expiration time and collection
        self.expires = Date.now() + self.maxAge;
        ModelService.replaceArray(self.storage, response.data);
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          return self.storage;
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          throw err;
        });
      });
  };

  // get one resource
  service.Collection.prototype.get = function(resourceId, options) {
    var self = this;
    options = options || {};
    if(Date.now() < self.expires && !options.force) {
      // check if resource already loaded
      var current = _.findWhere(self.storage, {id: resourceId});
      if(current) {
        return Promise.resolve(current);
      }
    }
    // FIXME: reject if resourceId not a sub-url of collection
    self.startLoading();
    var config = self._buildConfig(options);
    return Promise.resolve($http.get(resourceId, config))
      .then(function(response) {
        // update collection but not collection expiration time
        var storedObject = ModelService.replaceInArray(
          self.storage, response.data);
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          return storedObject;
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          throw err;
        });
      });
  };

  // get current resource
  service.Collection.prototype.getCurrent = function(options) {
    var currentId =
      $location.protocol() + '://' +
      $location.host() + ':' + $location.port() +
      $location.path();
    return this.get(currentId, options);
  };

  // add one resource to collection storage
  service.Collection.prototype.addToStorage = function(resource) {
    var self = this;
    // update collection if resource not present
    if(!_.findWhere(self.storage, {id: resource.id})) {
      self.storage.push(resource);
    }
    return Promise.resolve(resource);
  };

  // add one resource
  service.Collection.prototype.add = function(resource, options) {
    var self = this;
    options = options || {};
    self.startLoading();
    var config = self._buildConfig(options);
    var url = _getUrl(self.config, 'add');
    return Promise.resolve($http.post(url, resource, config))
      .then(function(response) {
        // don't update collection expiration time
        // update collection if resource not present
        var storedData;
        return self.addToStorage(response.data)
          .then(function(_storedData) {
            storedData = _storedData;
          })
          .then(function() {
            return self.finishLoading();
          })
          .then(function() {
            $rootScope.$apply();
            return storedData;
          });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          throw err;
        });
      });
  };

  // update one resource
  service.Collection.prototype.update = function(resource, options) {
    var self = this;
    options = options || {};
    self.startLoading();
    var config = self._buildConfig(options);
    return Promise.resolve($http.post(resource.id, resource, config))
      .then(function(response) {
        // don't update collection expiration time
        // re-get resource to update collection
        return self.get(options.get || resource.id, {force: true});
      }).then(function(updatedResource) {
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          return updatedResource;
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          throw err;
        });
      });
  };

  // delete one resource
  service.Collection.prototype.del = function(resourceId, options) {
    var self = this;
    options = options || {};
    self.startLoading();
    var config = self._buildConfig(options);
    return Promise.resolve($http.delete(resourceId, config))
      .then(function(response) {
        // don't update collection expiration time
        // update collection if resource present
        if(_.findWhere(self.storage, {id: resourceId})) {
          ModelService.removeFromArray(resourceId, self.storage);
        }
        return self.finishLoading().then(function() {
          $rootScope.$apply();
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$apply();
          throw err;
        });
      });
  };

  /**
   * Clear all data.
   */
  service.Collection.prototype.clear = function() {
    var self = this;
    ModelService.replaceArray(self.storage, []);
  };

  /**
   * Set the query params object.
   */
  service.Collection.prototype.setQuery = function(params) {
    var self = this;

    self.config.query = params;
  }

  /**
   * Build a $http config from collection options.
   */
  service.Collection.prototype._buildConfig = function(options, config) {
    var self = this;

    config = config || {};
    if('delay' in options) {
      config.delay = options.delay;
    }
    // add global params if set
    if(self.config.query) {
      config.params = angular.copy(self.config.query);
    }
    // extend with current param options
    if('params' in options) {
      config.params = angular.extend(config.params || {}, options.params);
    }
    return config;
  }

  // expose service to scope
  $rootScope.app.services.resource = service;

  return service;
}

/**
 * Gets the URL from the config for the given collection method.
 *
 * @param config the config to check.
 * @param method the collection method, eg: 'getAll', 'add'.
 *
 * @return the URL to use for the collection method.
 */
function _getUrl(config, method) {
  if(config.urls && method in config.urls) {
    return config.urls[method];
  }
  return config.url;
}

return {ResourceService: factory};

});
