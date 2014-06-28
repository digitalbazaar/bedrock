/*!
 * Identity Settings.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define(['angular', 'forge/forge', 'underscore'], function(angular, forge, _) {

'use strict';

var deps = ['$scope', 'config', 'AlertService', 'IdentityService'];
return {IdentitySettingsController: deps.concat(factory)};

function factory($scope, config, AlertService, IdentityService) {
  var self = this;
  self.state = IdentityService.state;
  self.help = {};
  self.identity = null
  self.emailHash = null;
  self.imagePreview = null;
  self.allPublic = true;
  self.public = {};
  self.loading = true;

  var _gravatarUrl = function() {
    var url = 'https://secure.gravatar.com/avatar/' + self.emailHash;
    // use G rating
    url += '?r=g';
    if(self.identity.sysGravatarType === 'gravatar') {
      // default to mystery man
      url += '&d=mm';
    } else {
      // force a custom type
      url += '&f=y&d=' + self.identity.sysGravatarType;
    }
    return url;
  }

  var _updateImagePreview = function() {
    switch(self.identity.sysImageType) {
      case 'url':
        self.imagePreview = self.identity.image;
        break;
      case 'gravatar':
        // generate gravatar image
        self.imagePreview = _gravatarUrl();
        // use 80px x 80px for preview
        self.imagePreview += '&s=80';
        break;
    }
  };
  // only update every ~1s, to avoid too many requests while typing
  var _updateImagePreviewSlowly = _.debounce(function() {
    _updateImagePreview();
    $scope.$apply();
  }, 1000);

  $scope.$watchGroup([
    function() {return self.identity.sysImageType;},
    function() {return self.identity.sysGravatarType;}
  ], function(value) {
    _updateImagePreview();
  });

  $scope.$watch(function() {return self.identity.image;}, function(value) {
    _updateImagePreviewSlowly();
  });

  self.cancel = function() {
    self.identity = {};
    angular.extend(self.identity, IdentityService.identity);
    self.identity.sysImageType = self.identity.sysImageType || 'gravatar';
    self.identity.sysGravatarType = self.identity.sysGravatarType || 'gravatar';

    // setup public values
    self.public = {};
    if(self.identity.sysPublic) {
      var _checkPublic = function(property) {
        var isPublic = false;
        self.public[property] = self.identity.sysPublic.indexOf(property) > -1;
      };
      _checkPublic('label');
      _checkPublic('url');
      _checkPublic('image');
      _checkPublic('description');
    }
    self.allPublic = _.chain(self.public).values().every().value();

    self.loading = false;

    // cache email hash for gravatar
    var md = forge.md.md5.create();
    md.update(IdentityService.identity.email, 'utf8');
    self.emailHash = md.digest().toHex();
  };

  self.update = function() {
    // setup public fields
    var sysPublic = [];
    var _checkPublic = function(property) {
      if(self.allPublic || self.public[property]) {
        sysPublic.push(property);
      }
    };
    _checkPublic('label');
    _checkPublic('url');
    _checkPublic('image');
    _checkPublic('description');
    var update = {
      '@context': config.data.contextUrl,
      id: self.identity.id,
      description: self.identity.description,
      image: _gravatarUrl(),
      label: self.identity.label,
      sysGravatarType: self.identity.sysGravatarType,
      sysImageType: self.identity.sysImageType,
      sysPublic: sysPublic,
      url: self.identity.url
    };
    self.loading = true;
    AlertService.clear();
    IdentityService.collection.update(update)
      .catch(function(err) {
        AlertService.add('error', err);
      })
      .then(function() {
        self.loading = false;
        $scope.$apply();
      });
  };

  // reset
  self.cancel();
}

});
