/*!
 * Template Cache Service.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$rootScope', '$http', '$templateCache'];
return {svcTemplateCache: deps.concat(factory)};

function factory($rootScope, $http, $templateCache) {
  var service = {};

  service.get = function(url, callback) {
    $http.get(url, {cache: $templateCache})
      .success(function(data) {
        callback(null, data);
      })
      .error(function(data, status, headers) {
        callback('Failed to load template: ' + url);
      });
  };

  // expose service to scope
  $rootScope.app.services.templateCache = service;

  return service;
}

});
