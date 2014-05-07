/*!
 * Resource Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author David I. Lehn
 * @author Dave Longley
 */
define(['angular', 'underscore'], function(angular, _) {

'use strict';

var deps = ['$rootScope', '$http', '$location', 'svcModel'];
return {svcResource: deps.concat(factory)};

function factory($rootScope, $http, $location, svcModel) {
  var service = {};

  // create a new collection
  // config: {
  //   storage: reference to external array of data (optional)
  //   url: url to collection (string)
  //   expires: time data expires (timestamp, optional [0])
  //   maxAge: maximum cache age (ms, optional [2m])
  // }
  service.Collection = function(config) {
    this.config = config;
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
  };

  // get all collection resources
  service.Collection.prototype.getAll = function(options) {
    var self = this;
    options = options || {};
    if(Date.now() < self.expires && !options.force) {
      return Promise.resolve(self.storage);
    }
    return new Promise(function(resolve, reject) {
      self.startLoading();
      var config = _buildConfig(options);
      var url = _getUrl(self.config, 'getAll');
      var promise = Promise.cast($http.get(url, config));
      promise.then(function(response) {
        // update expriation time and collection
        self.expires = Date.now() + self.maxAge;
        svcModel.replaceArray(self.storage, response.data);
        self.finishLoading();
        resolve(self.storage);
        $rootScope.$apply();
      }).catch(function(err) {
        self.finishLoading();
        reject(err);
        $rootScope.$apply();
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
    return new Promise(function(resolve, reject) {
      self.startLoading();
      var config = _buildConfig(options);
      var promise = Promise.cast($http.get(resourceId, config));
      promise.then(function(response) {
        // update collection but not collection expiration time
        svcModel.replaceInArray(self.storage, response.data);
        self.finishLoading();
        resolve(response.data);
        $rootScope.$apply();
      }).catch(function(err) {
        self.finishLoading();
        reject(err);
        $rootScope.$apply();
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

  // add one resource
  service.Collection.prototype.add = function(resource, options) {
    var self = this;
    options = options || {};
    return new Promise(function(resolve, reject) {
      self.startLoading();
      var config = _buildConfig(options);
      var url = _getUrl(self.config, 'add');
      var promise = Promise.cast($http.post(url, resource, config));
      promise.then(function(response) {
        // don't update collection expiration time
        // update collection if resource not present
        if(!_.findWhere(self.storage, {id: response.data.id})) {
          self.storage.push(response.data);
        }
        self.finishLoading();
        resolve(response.data);
        $rootScope.$apply();
      }).catch(function(err) {
        self.finishLoading();
        reject(err);
        $rootScope.$apply();
      });
    });
  };

  // update one resource
  service.Collection.prototype.update = function(resource, options) {
    var self = this;
    options = options || {};
    return new Promise(function(resolve, reject) {
      self.startLoading();
      var config = _buildConfig(options);
      var promise = Promise.cast($http.post(resource.id, resource, config));
      promise.then(function(response) {
        // don't update collection expiration time
        // re-get resource to update collection
        return self.get(options.get || resource.id, {force: true});
      }).then(function(updatedResource) {
        self.finishLoading();
        resolve(updatedResource);
        $rootScope.$apply();
      }).catch(function(err) {
        self.finishLoading();
        reject(err);
        $rootScope.$apply();
      });
    });
  };

  // delete one resource
  service.Collection.prototype.del = function(resourceId, options) {
    var self = this;
    options = options || {};
    return new Promise(function(resolve, reject) {
      self.startLoading();
      var config = _buildConfig(options);
      var promise = Promise.cast($http.delete(resourceId, config));
      promise.then(function(response) {
        // don't update collection expiration time
        // update collection if resource present
        if(_.findWhere(self.storage, {id: resourceId})) {
          svcModel.removeFromArray(resourceId, self.storage);
        }
        self.finishLoading();
        resolve();
        $rootScope.$apply();
      }).catch(function(err) {
        self.finishLoading();
        reject(err);
        $rootScope.$apply();
      });
    });
  };

  return service;
}

/**
 * Build a $http config from collection options.
 */
function _buildConfig(options, config) {
  config = config || {};
  if('delay' in options) {
    config.delay = options.delay;
  }
  if('params' in options) {
    config.params = options.params;
  }
  return config;
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

});
