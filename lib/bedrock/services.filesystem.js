/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  website: require('./website')
};
var fs = require('fs');
var path = require('path');
var BedrockError = bedrock.tools.BedrockError;

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
  app.server.get('/files', function(req, res, next) {
    if(req.query.action === 'read') {
      return _readFile(req, res, next);
    }
    // assume action is 'list'
    _readDirectory(req, res, next);
  });
  callback(null);
}

/**
 * Reads the contents of a file and send it in the response.
 *
 * @param req the HTTP request object.
 * @param res the HTTP response object.
 * @param next(err) the next HTTP handler in the chain.
 */
function _readFile(req, res, next) {
  async.waterfall([
    function(callback) {
      // check to see if the given file exists
      var filePath = req.query.path ? req.query.path : '';
      fs.exists(filePath, function(exists) {
        if(exists) {
          return callback(null, filePath);
        }
        callback(new BedrockError(
          'The file at the given path could not be found.',
          MODULE_NS + '.FileNotFound', {
            httpStatusCode: 404,
            'public': true
          }));
      });
    },
    function(filePath, callback) {
      fs.lstat(filePath, function(err, stat) {
        if(err) {
          return callback(new BedrockError(
            'The file at the given path could not be examined.',
            MODULE_NS + '.FileStatFailed', {
              httpStatusCode: 400,
              'public': true
            }, err));
        }

        // Check to make sure the path represents a file
        if(!stat.isFile()) {
          return callback(new BedrockError(
            'The resource at the given path is not a file.',
            MODULE_NS + '.ResourceIsNotFile', {
              httpStatusCode: 400,
              'public': true
            }, err));
        }
        callback(null, filePath);
      });
    }
  ], function(err, filePath) {
    if(err) {
      return next(err);
    }

    res.setHeader("content-type", 'application/octet-stream');
    fs.createReadStream(filePath).pipe(res);
  });
}

/**
 * Reads the contents of a directory and send it in the response.
 *
 * @param req the HTTP request object.
 * @param res the HTTP response object.
 * @param next(err) the next HTTP handler in the chain.
 */
function _readDirectory(req, res, next) {
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
    }
  ], function(err, result) {
    res.json(result);
  });
}
