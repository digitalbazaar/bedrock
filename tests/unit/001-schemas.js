/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _schema_dir = '../../schemas';

var should = require('should');

var comment = require(_schema_dir + '/comment');
var jsonschema = require('json-schema');
var slug = require(_schema_dir + '/slug');

// FIXME: add more tests, test for proper errors
describe('PaySwarm JSON-LD REST API input schema', function() {
  describe('comment', function() {
    var schema = comment();
    it('should be an Object', function(done) {
      schema.should.be.an.instanceof(Object);
      done();
    });
    it('should reject empty comments', function(done) {
      var result = jsonschema('', schema);
      result.valid.should.be.false;
      done();
    });
    it('should reject comments that are too long', function(done) {
      var result = jsonschema(
          // 257 chars
          '12345678901234567890123456789012345678901234567890' +
          '12345678901234567890123456789012345678901234567890' +
          '12345678901234567890123456789012345678901234567890' +
          '12345678901234567890123456789012345678901234567890' +
          '12345678901234567890123456789012345678901234567890' +
          '1234567',
          schema);
      result.valid.should.be.false;
      done();
    });
    it('should accept valid comments', function(done) {
      var small = jsonschema('1', schema);
      small.errors.should.be.empty;
      small.valid.should.be.true;
      var large = jsonschema(
        // 256 chars
        '12345678901234567890123456789012345678901234567890' +
        '12345678901234567890123456789012345678901234567890' +
        '12345678901234567890123456789012345678901234567890' +
        '12345678901234567890123456789012345678901234567890' +
        '12345678901234567890123456789012345678901234567890' +
        '123456',
        schema);
      large.valid.should.be.true;
      done();
    });
    it('should accept normal non-letter symbols', function(done) {
      var result = jsonschema(
          '-a-zA-Z0-9~!@#$%^&*()_=+\\|{}[];:\'"<>,./? ',
          schema);
      result.valid.should.be.true;
      done();
    });
    it('should reject newline characters', function(done) {
      var result = jsonschema('\n', schema);
      result.valid.should.be.false;
      done();
    });
  });

  describe('slug', function() {
    var schema = slug();
    it('should be an Object', function(done) {
      schema.should.be.an.instanceof(Object);
      done();
    });
    it('should reject empty slugs', function(done) {
      var result = jsonschema('', schema);
      result.valid.should.be.false;
      done();
    });
    it('should reject slugs that are too short', function(done) {
      // 2 chars
      var result = jsonschema('12', schema);
      result.valid.should.be.false;
      done();
    });
    it('should reject slugs that are too long', function(done) {
      // 33 chars
      var result = jsonschema('123456789012345678901234567890123', schema);
      result.valid.should.be.false;
      done();
    });
    it('should accept valid slugs', function(done) {
      // 3 chars
      var result = jsonschema('a23', schema);
      result.valid.should.be.true;
      // 32 chars
      var result = jsonschema(
        'a2345678901234567890123456789012',
        schema);
      result.valid.should.be.true;
      done();
    });
    it('should accept normal non-letter characters', function(done) {
      var result = jsonschema('az-az09~_.', schema);
      result.valid.should.be.true;
      done();
    });
    it('should reject invalid characters', function(done) {
      var result = jsonschema('badchar@', schema);
      result.valid.should.be.false;
      var result = jsonschema('0numstart', schema);
      result.valid.should.be.false;
      done();
    });
  });
});
