/*!
 * Remote file selection modal.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Manu Sporny
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($http, AlertService) {
  return {
    restrict: 'A',
    require: '^stackable',
    templateUrl:
      '/app/components/remote-file-selector/remote-file-selector-modal.html',
    link: Link
  };

  function Link(scope, element, attrs, stackable) {
    var model = scope.model = {};

    model.remoteFileData = scope.remoteFileData;
    model.loading = false;
    model.path = null;
    model.pathSeparator = '';
    model.pathContents = {};
    model.selectedDirectory = '';

    // watch the selected path, file, directory, and path components
    scope.$watch('model.path', function(value) {
      if(value) {
        model.changeDirectory(value);
      }
    });
    scope.$watch('model.selectedFile', function(value) {
      if(value) {
        var filename = model.path + model.separator + value.filename;
        model.selectFile(filename);
      }
    });
    scope.$watch('model.selectedDirectory', function(value) {
      var directory =
        model.path + model.separator + model.selectedDirectory.filename;
      model.changeDirectory(directory);
    });

    // change directory by fetching the file list for the new path
    model.changeDirectory = function(path) {
      model.getFileList(path);
    };

    // note that a file has been selected in the UI
    model.selectFile = function(path) {
      model.selectedFilename = path;
    };

    // load a selected file from the server
    model.loadSelectedFile = function() {
      var url = '/files?action=read&path=' +
        encodeURIComponent(model.selectedFilename);

      model.loading = true;
      AlertService.clearFeedback();
      Promise.resolve($http.get(url)).then(function(response) {
        model.loading = false;
        stackable.close(null, response.data);
        scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        AlertService.add('error', err, {scope: scope});
        scope.$apply();
      });
    };

    // retrieve a list of files from the server given a path
    model.getFileList = function(path) {
      var url = '/files?action=listdir';
      if(path) {
        url += '&path=' + encodeURIComponent(path);
      }

      model.loading = true;
      AlertService.clearFeedback();
      Promise.resolve($http.get(url)).then(function(response) {
        model.loading = false;
        model.pathContents = response.data;
        model.path = response.data.path;
        model.separator = response.data.separator;
        scope.$apply();
      }).catch(function(err) {
        model.loading = false;
        AlertService.add('error', err, {scope: scope});
        scope.$apply();
      });
    };

    // initialize the file list
    model.getFileList();
  }
}

return {brRemoteFileSelectorModal: factory};

});
