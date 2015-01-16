/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
var jsonldContext = require('./jsonldContext');
var label = require('./label');
var identifier = require('./identifier');
var privateKeyPem = require('./privateKeyPem');
var publicKeyPem = require('./publicKeyPem');

var postKey = {
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    id: identifier(),
    label: label({required: false}),
    revoked: {
      required: false,
      type: 'string'
    }
  },
  additionalProperties: false
};

var postKeys = {
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    label: label(),
    publicKeyPem: publicKeyPem(),
    privateKeyPem: privateKeyPem({required: false})
  },
  additionalProperties: false
};

module.exports.postKey = function() {
  return postKey;
};
module.exports.postKeys = function() {
  return postKeys;
};
