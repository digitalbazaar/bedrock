/*!
 * Login Support.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$scope', '$http', '$compile', '$window', 'config'];
return {LoginController: deps.concat(factory)};

function factory($scope, $http, $compile, $window, config) {
  var self = this;
  self.multiple = false;
  self.loading = false;
  self.error = '';
  self.sysIdentifier = '';
  self.password = '';
  self.request = config.data.queuedRequest;
  self.siteTitle = config.data.siteTitle;
  self.navbar = config.site.navbar;

  self.submit = function() {
    // do login
    self.error = '';
    self.loading = true;
    Promise.resolve($http.post('/session/login', {
      sysIdentifier: self.sysIdentifier,
      password: self.password
    })).then(function(response) {
      // if a single 'identity' is returned, login was successful
      var data = response.data;
      if(data.identity) {
        // if there's no queued request, go to dashboard
        var request = self.request;
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
        self.multiple = true;
        self.email = data.email;
        self.choices = [];
        angular.forEach(data.identities, function(identity, identityId) {
          self.choices.push({id: identityId, label: identity.label});
        });
        self.sysIdentifier = self.choices[0].id;
        self.loading = false;
        $scope.$apply();
      }
    }).catch(function(err) {
      // FIXME: use directive to show feedback?
      if(err.type === 'bedrock.validation.ValidationError') {
        self.error = 'Please enter your email address and password.';
      } else {
        self.error = err.message;
      }
      self.loading = false;
      $scope.$apply();
    });
  };
}

});
