/*
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 */

'use strict';

var async = require('async');
var superagent = require('superagent');
var should = GLOBAL.should;

var bedrock = {
  config: require('../../lib/config'),
};

describe('bedrock-server', function() {
  describe('HTTP Strict Transport Security', function() {
    it('should be enabled by default', function(done) {
      var httpUrl = 'http://' + bedrock.config.server.domain + ':' +
        bedrock.config.server.httpPort + '/';
      superagent.get(httpUrl)
        .redirects(0)
        .end(function(err, res) {
          res.status.should.equal(302);
          res.header.should.have.property(
            'strict-transport-security', 'max-age=31536000');
          done(err);
        });
    });
  });
});
