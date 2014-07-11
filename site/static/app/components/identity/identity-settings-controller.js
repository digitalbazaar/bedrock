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

/* @ngInject */
function factory($scope, config, AlertService, IdentityService) {
  var self = this;
  self.state = IdentityService.state;
  self.help = {};
  self.identity = null;
  self.emailHash = null;
  self.imagePreview = null;
  self.publicMode = 'most';
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
  };

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
      var sp = self.identity.sysPublic;
      // setup each public field flag
      var _setupPublic = function(property) {
        self.public[property] = sp.indexOf(property) > -1;
      };
      _setupPublic('description');
      _setupPublic('email');
      _setupPublic('image');
      _setupPublic('label');
      _setupPublic('url');
      // setup public mode
      if(_.isEqual(sp, ['description', 'email', 'image', 'label', 'url'])) {
        self.publicMode = 'all';
      } else if(_.isEqual(sp, ['description', 'image', 'label', 'url'])) {
        self.publicMode = 'most';
      } else if(_.isEqual(sp, [])) {
        self.publicMode = 'none';
      } else {
        self.publicMode = 'some';
      }
    }

    // cache email hash for gravatar
    var md = forge.md.md5.create();
    md.update(IdentityService.identity.email, 'utf8');
    self.emailHash = md.digest().toHex();

    self.loading = false;
  };

  self.update = function() {
    // setup public fields
    var sysPublic = [];
    var _setupPublic = function(property) {
      switch(self.publicMode) {
        case 'none':
          break;
        case 'some':
          if(self.public[property]) {
            sysPublic.push(property);
          }
          break;
        case 'most':
          if(property !== 'email') {
            sysPublic.push(property);
          }
          break;
        case 'all':
          sysPublic.push(property);
          break;
      }
    };
    _setupPublic('description');
    _setupPublic('email');
    _setupPublic('image');
    _setupPublic('label');
    _setupPublic('url');

    var update = {
      '@context': config.data.contextUrl,
      id: self.identity.id,
      description: self.identity.description,
      label: self.identity.label,
      sysImageType: self.identity.sysImageType,
      sysPublic: sysPublic,
      url: self.identity.url
    };

    switch(self.identity.sysImageType) {
      case 'url':
        update.image = self.identity.image;
        break;
      case 'gravatar':
        update.image = _gravatarUrl();
        update.sysGravatarType = self.identity.sysGravatarType;
        break;
    }

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

return {IdentitySettingsController: factory};

});
