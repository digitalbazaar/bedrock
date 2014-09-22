/*
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 */

'use strict';

var async = require('async');
var fs = require('fs');
var mkdirp = require('mkdirp');
var path = require('path');
var request = require('request');
var superagent = require('superagent');

var bedrock = {
  config: require('../../lib/config'),
  security: require('../../lib/bedrock/security')
};

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

describe('bedrock.services.filesystem', function() {
  var fsService = bedrock.config.server.baseUri + '/files';

  describe('filesystem reading', function() {
    var agent = superagent.agent();
    var testDir = path.join(__dirname, 'filesystem');
    var testFile = path.join(testDir, 'test.txt');

    // create a test directory and file
    before(function(done) {
      async.auto({
        createTestDir: function(callback) {
          mkdirp(testDir, callback);
        },
        createTestFile: ['createTestDir', function(callback) {
          fs.writeFile(testFile, 'filesystem service test file', callback);
        }],
        performLogin: ['createTestDir', 'createTestFile', function(callback) {
          var loginService = bedrock.config.server.baseUri + '/session/login';
          agent.post(loginService)
            .send({sysIdentifier: 'dev', password: 'password'})
            .end(function(err, res) {
              res.status.should.equal(200);
              callback(err);
            });
        }]
      }, done);
    });

    it('should be able to read a file', function(done) {
      var readUrl = fsService + '?action=read&path=' + testFile;
      agent.get(readUrl)
        .end(function(err, res) {
          res.status.should.equal(200);
          res.text.should.equal('filesystem service test file');
          done();
        });
    });

    it('should be able to read directory contents', function(done) {
      var readUrl = fsService + '?path=' + testDir;
      agent.get(readUrl)
        .end(function(err, res) {
          res.status.should.equal(200);
          res.body.should.have.property('files').with.lengthOf(1);
          res.body.files[0].should.have.property('size', 28);
          done();
        });
    });

    // remove test directory and file
    after(function(done) {
      var testDir = path.join(__dirname, 'filesystem');
      var testFile = path.join(testDir, 'test.txt');

      async.auto({
        removeTestFile: function(callback) {
          fs.unlink(testFile, callback);
        },
        removeTestDir: ['removeTestFile', function(callback) {
          fs.rmdir(testDir, callback);
        }]
      }, done);
    });

  });

  describe('filesystem writing', function() {
    var agent = superagent.agent();
    var testDir = path.join(__dirname, 'filesystem2');
    var testFile = path.join(testDir, 'test2.txt');
    var cookie = '';

    // login to perform the file creation tests
    before(function(done) {
      async.auto({
        performLogin: function(callback) {
          var loginService = bedrock.config.server.baseUri + '/session/login';
          agent.post(loginService)
            .send({sysIdentifier: 'dev', password: 'password'})
            .end(function(err, res) {
              res.status.should.equal(200);
              cookie = res.headers['set-cookie'][0];
              callback(err);
            });
        }
      }, done);
    });

    it('should be able to create a directory', function(done) {
      var mkdirUrl = fsService + '?action=mkdir&path=' + testDir;
      agent.post(mkdirUrl)
        .end(function(err, res) {
          res.status.should.equal(201);
          done();
        });
    });

    it('should be able to write a file', function(done) {
      var writeFileUrl = fsService + '?action=write&path=' + testFile;

      // can't use superagent to post octet-stream data because it's buggy
      request({
        method: 'POST',
        url: writeFileUrl,
        headers: {
          'content-type' : 'application/octet-stream',
          'cookie': cookie
        },
        body: 'filesystem write test'
      }, function(err, res) {
        res.statusCode.should.equal(201);
        done();
      });
    });

    // remove test directory and file
    after(function(done) {
      var testDir = path.join(__dirname, 'filesystem2');
      var testFile = path.join(testDir, 'test2.txt');

      async.auto({
        removeTestFile: function(callback) {
          fs.unlink(testFile, callback);
        },
        removeTestDir: ['removeTestFile', function(callback) {
          fs.rmdir(testDir, callback);
        }]
      }, done);
    });
  });

});
