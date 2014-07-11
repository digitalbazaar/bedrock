/*
 * Copyright (c) 2013-2014 Digital Bazaar, Inc. All rights reserved.
 */
var _ = require('underscore');
var async = require('async');
var passport = require('passport');
var bedrock = {
  identity: require('./identity'),
  tools: require('./tools')
};
var util = require('util');
var httpSignature = require('http-signature');
var BedrockError = bedrock.tools.BedrockError;

module.exports = Strategy;

var REQUIRED_HEADERS = ['request-line', 'host', 'date'];

/**
 * Creates a new SignedGraphStrategy for use with passport.
 */
function Strategy() {
  passport.Strategy.call(this);
  this.name = 'bedrock.httpSignature';
}
util.inherits(Strategy, passport.Strategy);

/**
 * Authenticate a request.
 *
 * @param req the request to authenticate.
 */
Strategy.prototype.authenticate = function(req) {
  var self = this;

  // check that message is signed with the Signature scheme
  // check for 'Authorization: Signature ...'
  var found = false;
  var auth = req.get('Authorization');
  if(auth) {
    var parts = auth.split(' ');
    if(parts && parts.length > 0 && parts[0] === 'Signature') {
      found = true;
    }
  }
  if(!found) {
    return self.fail(new BedrockError(
      'Request is not signed.',
      'bedrock.HttpSignatureStrategy.NotSigned'));
  }

  async.auto({
    parseRequest: function(callback) {
      var parsed;
      try {
        parsed = httpSignature.parseRequest(req);
      } catch(ex) {
        return callback(new BedrockError(
          'Request signature parse error.',
          'bedrock.HttpSignatureStrategy.ParseError',
          null, ex));
      }
      callback(null, parsed);
    },
    checkRequest: ['parseRequest', function(callback, results) {
      var diff = _.difference(
        REQUIRED_HEADERS,
        results.parseRequest.params.headers);
      if(diff.length > 0) {
        return callback(new BedrockError(
          'Missing required headers in HTTP signature.',
          'bedrock.HttpSignatureStrategy.MissingHeaders', {
            'public': true,
            httpStatusCode: 400,
            requiredHeaders: REQUIRED_HEADERS
          }));
      }
      callback(null);
    }],
    getPublicKey: ['checkRequest', function(callback, results) {
      var publicKey = {id: results.parseRequest.keyId};
      bedrock.identity.getIdentityPublicKey(
        publicKey, function(err, publicKey) {
        callback(err, publicKey);
      });
    }],
    verify: ['getPublicKey', function(callback, results) {
      var verified;
      try {
        verified = httpSignature.verifySignature(
          results.parseRequest, results.getPublicKey.publicKeyPem);
      } catch(ex) {
        return callback(new BedrockError(
          'Request signature verify error.',
          'bedrock.HttpSignatureStrategy.VerifyError', {cause: ex}));
      }
      if(!verified) {
        return callback(new BedrockError(
          'Request signature verification failed.',
          'bedrock.HttpSignatureStrategy.VerifyFailure'));
      }
      callback();
    }],
    getIdentity: ['verify', function(callback, results) {
      // get identity without permission check
      bedrock.identity.getIdentity(
        null, results.getPublicKey.owner, function(err, identity) {
          callback(err, identity);
        });
    }]
  }, function(err, results) {
    if(err) {
      return self.error(err);
    }
    req.user = {
      identity: results.getIdentity
    };
    self.success(req.user);
  });
};
