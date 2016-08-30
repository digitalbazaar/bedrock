/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */

'use strict';

var bedrock = require('../lib/bedrock');
var BedrockError = bedrock.util.BedrockError;

describe('bedrock', function() {
  describe('util.extend()', function() {
    it('should perform in-place default extension', function(done) {
      var result = {};
      bedrock.util.extend(result, {a: 1});
      result.should.eql({a: 1});
      done();
    });
    it('should perform in-place deep extension', function(done) {
      var result = {a: {a0: 0}, b: 2};
      bedrock.util.extend(true, result, {a: {a1: 1}});
      result.should.eql({a: {a0: 0, a1: 1}, b: 2});
      done();
    });
    it('should perform in-place shallow extension', function(done) {
      var result = {a: {a0: 0}, b: 2};
      bedrock.util.extend(false, result, {a: {a1: 1}});
      result.should.eql({a: {a1: 1}, b: 2});
      done();
    });
    it('should be able to return a new object', function(done) {
      var result = bedrock.util.extend(true, {}, {a: 1});
      result.should.eql({a: 1});
      done();
    });
    it('should merge multiple objects into a new object', function(done) {
      var result = {};
      bedrock.util.extend(true, result, {a: 1}, {b: 2});
      result.should.eql({a: 1, b: 2});
      done();
    });
  });
  describe('util.BedrockError', function() {
    it('should have correct type', function(done) {
      var err = new BedrockError('E', 'TYPE', null, null);
      err.isType('BOGUS').should.be.false;
      err.isType('TYPE').should.be.true;
      err.hasType('BOGUS').should.be.false;
      err.hasType('TYPE').should.be.true;
      done();
    });
    it('should have correct cause', function(done) {
      var err0 = new BedrockError('E0', 'E0TYPE', null, null);
      var err1 = new BedrockError('E1', 'E1TYPE', null, err0);
      err1.isType('BOGUS').should.be.false;
      err1.isType('E1TYPE').should.be.true;
      err1.hasType('BOGUS').should.be.false;
      err1.hasType('E0TYPE').should.be.true;
      err1.hasType('E1TYPE').should.be.true;
      done();
    });
  });
  describe('util.computedConfig()', function() {
    const cc = bedrock.util.computedConfig;
    it('should create', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', () => config.base.a + config.base.b);
      config.computed.should.equal('ab');
    });
    it('should update', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', () => config.base.a + config.base.b);
      config.computed.should.equal('ab');
      config.base.a = 'a2';
      config.base.b = 'b2';
      config.computed.should.equal('a2b2');
    });
    it('should create template', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', '${base.a + base.b}', {
        locals: config
      });
      config.computed.should.equal('ab');
    });
    it('should update template', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', '${base.a + base.b}', {
        locals: config
      });
      config.computed.should.equal('ab');
      config.base.a = 'a2';
      config.base.b = 'b2';
      config.computed.should.equal('a2b2');
    });
    it('should create two layers', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', () => config.base.a + config.base.b);
      cc(config, 'computed2', () => config.computed + config.computed);
      config.computed2.should.equal('abab');
    });
    it('should update two layers', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', () => config.base.a + config.base.b);
      cc(config, 'computed2', () => config.computed + config.computed);
      config.computed2.should.equal('abab');
      config.base.a = 'a2';
      config.base.b = 'b2';
      config.computed2.should.equal('a2b2a2b2');
    });
    it('should create twice', function() {
      var config = {base: {}};
      config.base.a = 'a';
      config.base.b = 'b';
      cc(config, 'computed', 'computed');
      cc(config, 'computed', 'computed2');
      config.computed.should.equal('computed2');
    });
    it('should support set', function() {
      var config = {};
      cc(config, 'computed', 'computed');
      config.computed.should.equal('computed');
      config.computed = 'computed2';
      config.computed.should.equal('computed2');
    });
    it('should support "delete"', function() {
      var config = {};
      cc(config, 'computed', 'computed');
      config.computed.should.equal('computed');
      delete config.computed;
      (typeof config.computed).should.equal('undefined');
    });
    it('should support "in"', function() {
      var config = {};
      cc(config, 'computed', 'computed');
      ('computed' in config).should.be.true;
    });
    it('should support JSON serialization', function() {
      var config = {};
      cc(config, 'computed', 'computed');
      config.computed.should.equal('computed');
      JSON.stringify(config).should.equal('{"computed":"computed"}');
    });
  });
});

// TODO: add test that adds logger early

/*
var winston = require('winston');

bedrock.events.on('bedrock-cli.init', function() {
  // TODO: test w/custom logger that writes to string, not file
  bedrock.loggers.addTransport('test', new winston.transports.File({
    level: 'debug',
    silent: false,
    json: false,
    timestamp: true,
    filename: '/tmp/test.log'
  }));
});
*/
