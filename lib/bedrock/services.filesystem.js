/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  website: require('./website')
};
var fs = require('fs');
var path = require('path');

// constants
var MODULE_NS = bedrock.website.namespace;

// sub module API
var api = {};
module.exports = api;

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  /*
   * WARNING: This website service is incredibly dangerous and should never be
   * placed in a production system that runs remotely (for example, a website).
   * It is meant for desktop applications only.
   */
  addServices(app, callback);
};

/**
 * Adds web services to the server.
 *
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {
  var baseUri = bedrock.config.server.baseUri;

  app.server.get('/files', function(req, res, next) {
    var dirpath = process.cwd();
    var data = {
      directories: [],
      files: []
    };

    async.waterfall([
      function(callback) {
        // check to see if the given directory exists
        var queryPath = req.query.path ? req.query.path : '';
        fs.exists(queryPath, function(exists) {
          callback(null, exists);
        });
      },
      function(exists, callback) {
        // if the directory exists, use that, otherwise use current working dir
        if(exists) {
          dirpath = req.query.path;
        }
        data.path = dirpath;
        fs.readdir(dirpath, callback);
      },
      function(files, callback) {
        // retrieve all of the file information
        async.each(files, function(filename, callback) {
          var fullpath = path.join(dirpath, filename);
          fs.lstat(fullpath, function(err, stat) {
            if(err) {
              return callback(null);
            }
            var fdata = stat;
            fdata.filename = filename;

            // separate files and directories for easier client-side processing
            if(stat.isFile()) {
              data.files.push(fdata);
            } else if(stat.isDirectory()) {
              data.directories.push(fdata);
            }
            callback(null);
          });
        }, function(err, result) {
          // FIXME: sort the files and directories
          callback(null);
        });
      },
      function(callback) {
        callback(null, data);
      }],
      function(err, result) {
        res.json(result);
    });
  });

  callback(null);
}
