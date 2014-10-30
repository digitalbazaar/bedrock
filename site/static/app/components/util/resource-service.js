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
function factory($rootScope, $http, $location, brModelService) {
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
    this.storage = this.config.storage || [];
    this.expires = this.config.expires || 0;
    this.maxAge = this.config.maxAge || (1000 * 60 * 2);

    this.loadingCount = 0;
    this.state = {
      loading: false
    };
  };

  service.Collection.prototype.startLoading = function(count) {
    this.loadingCount = this.loadingCount + (count || 1);
    this.state.loading = true;
  };

  service.Collection.prototype.finishLoading = function(count) {
    this.loadingCount = this.loadingCount - (count || 1);
    this.state.loading = (this.loadingCount !== 0);
    // ensure this.config.finishLoading is always called -- otherwise it
    // may never be called because there's no wait-queue/notification system
    // to call it when loading is finally false
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
    var url = self._getUrl('getAll');
    return Promise.resolve($http.get(url, config))
      .then(function(response) {
        // update expiration time and collection
        var doUpdate = self._doUpdate(options);
        if(doUpdate) {
          self.expires = Date.now() + self.maxAge;
          brModelService.replaceArray(self.storage, response.data);
        }
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
          return doUpdate ? self.storage : response.data;
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
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
        var doUpdate = self._doUpdate(options);
        var storedObject;
        if(doUpdate) {
          storedObject = brModelService.replaceInArray(
            self.storage, response.data);
        }
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
          return doUpdate ? storedObject : response.data;
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
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
  service.Collection.prototype.addToStorage = function(resource, options) {
    var self = this;
    options = options || {};
    // update collection if resource not present
    if(self._doUpdate(options)) {
      if(!_.findWhere(self.storage, {id: resource.id})) {
        self.storage.push(resource);
      }
    }
    return Promise.resolve(resource);
  };

  // add one resource
  service.Collection.prototype.add = function(resource, options) {
    var self = this;
    options = options || {};
    self.startLoading();
    var config = self._buildConfig(options);
    var url = self._getUrl('add');
    return Promise.resolve($http.post(url, resource, config))
      .then(function(response) {
        // don't update collection expiration time
        // update collection if resource not present
        var storedData;
        return self.addToStorage(response.data, options)
          .then(function(_storedData) {
            storedData = _storedData;
          })
          .then(function() {
            return self.finishLoading();
          })
          .then(function() {
            $rootScope.$applyAsync();
            return storedData;
          });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
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
        var getOpts = {
          force: true,
          update: self._doUpdate(options)
        };
        return self.get(options.get || resource.id, getOpts);
      }).then(function(updatedResource) {
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
          return updatedResource;
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
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
        if(self._doUpdate(options)) {
          if(_.findWhere(self.storage, {id: resourceId})) {
            brModelService.removeFromArray(resourceId, self.storage);
          }
        }
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
        });
      }).catch(function(err) {
        return self.finishLoading().then(function() {
          $rootScope.$applyAsync();
          throw err;
        });
      });
  };

  /**
   * Clear all data.
   */
  service.Collection.prototype.clear = function() {
    var self = this;
    brModelService.replaceArray(self.storage, []);
  };

  /**
   * Set the query params object.
   */
  service.Collection.prototype.setQuery = function(params) {
    var self = this;

    self.config.query = params;
  };

  /**
   * Build a $http config from collection options.
   */
  service.Collection.prototype._buildConfig = function(options) {
    var self = this;

    var config = {};
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
  };

  /**
   * Gets the URL from the config for the given collection method.
   *
   * @param method the collection method, eg: 'getAll', 'add'.
   *
   * @return the URL to use for the collection method.
   */
  service.Collection.prototype._getUrl = function(method) {
    var self = this;

    if(self.config.urls && method in self.config.urls) {
      return self.config.urls[method];
    }
    return self.config.url;
  };

  /**
   * Check if storage should be updated. If the options object has
   * an 'update' flag, it is used, otherwise always update.
   *
   * @param options collection method options.
   *
   * @return true if the collection storage should be updated.
   */
  service.Collection.prototype._doUpdate = function(options) {
    if('update' in options) {
      return options.update;
    }
    return true;
  };

  // expose service to scope
  $rootScope.app.services.resource = service;

  return service;
}

return {brResourceService: factory};

});
