/*!
 * Login Support.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$scope', 'config', '$http', '$compile', '$window'];
return {LoginCtrl: deps.concat(factory)};

function factory($scope, config, $http, $compile, $window) {
  var model = $scope.model = {};
  $scope.multiple = false;
  $scope.loading = false;
  $scope.error = '';
  $scope.sysIdentifier = '';
  $scope.password = '';
  model.request = config.data.queuedRequest;
  model.siteTitle = config.data.siteTitle;
  model.navbar = config.site.navbar;

  $scope.submit = function() {
    // do login
    $scope.error = '';
    $scope.loading = true;
    Promise.resolve($http.post('/session/login', {
      sysIdentifier: $scope.sysIdentifier,
      password: $scope.password
    })).then(function(response) {
      // if a single 'identity' is returned, login was successful
      var data = response.data;
      if(data.identity) {
        // if there's no queued request, go to dashboard
        var request = model.request;
        if(!request) {
          $window.location = data.identity.id + '/dashboard';
          return;
        }
        if(request.method === 'GET') {
          // redirect to queued URL
          $window.location = request.url;
          return;
        }
        // add form to page and submit it
        var element = angular.element([
          '<form data-ng-hide="!!model.request" method="post" ',
          'action="{{model.request.url}}">',
          '<input data-ng-repeat="(name, value) in model.request.body" ',
          'type="hidden" name="{{name}}" value="{{value}}" />',
          '</form>'
        ].join(''));
        angular.element('body').append(element);
        $compile(element)($scope);
        $scope.$apply();
        element.submit();
      } else {
        // show multiple identities
        $scope.multiple = true;
        $scope.email = data.email;
        $scope.choices = [];
        angular.forEach(data.identities, function(identity, identityId) {
          $scope.choices.push({id: identityId, label: identity.label});
        });
        $scope.sysIdentifier = $scope.choices[0].id;
        $scope.loading = false;
        $scope.$apply();
      }
    }).catch(function(err) {
      // FIXME: use directive to show feedback?
      if(err.type === 'bedrock.validation.ValidationError') {
        $scope.error = 'Please enter your email address and password.';
      } else {
        $scope.error = err.message;
      }
      $scope.loading = false;
      $scope.$apply();
    });
  };
}

});
