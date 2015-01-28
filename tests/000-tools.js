/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */

'use strict';

var bedrock = require('../lib/bedrock');
var BedrockError = bedrock.tools.BedrockError;

describe('bedrock.tool utility tests', function() {
  describe('tools.extend()', function() {
    it('should perform in-place default extension', function(done) {
      var result = {};
      bedrock.tools.extend(result, {a: 1});
      result.should.eql({a: 1});
      done();
    });
    it('should perform in-place deep extension', function(done) {
      var result = {a: {a0: 0}, b: 2};
      bedrock.tools.extend(true, result, {a: {a1: 1}});
      result.should.eql({a: {a0: 0, a1: 1}, b: 2});
      done();
    });
    it('should perform in-place shallow extension', function(done) {
      var result = {a: {a0: 0}, b: 2};
      bedrock.tools.extend(false, result, {a: {a1: 1}});
      result.should.eql({a: {a1: 1}, b: 2});
      done();
    });
    it('should be able to return a new object', function(done) {
      var result = bedrock.tools.extend(true, {}, {a: 1});
      result.should.eql({a: 1});
      done();
    });
    it('should merge multiple objects into a new object', function(done) {
      var result = {};
      bedrock.tools.extend(true, result, {a: 1}, {b: 2});
      result.should.eql({a: 1, b: 2});
      done();
    });
  });
  describe('tools.BedrockError', function() {
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
});
