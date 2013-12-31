/*!
 * Template Cache Service.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

var deps = ['$http', '$templateCache'];
return {svcTemplateCache: deps.concat(factory)};

function factory($http, $templateCache) {
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
  return service;
}

});
