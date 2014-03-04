/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var jsonldContext = require('./jsonldContext');
var jsonldType = require('./jsonldType');
var label = require('./label');
var identifier = require('./identifier');
var publicKeyPem = require('./publicKeyPem');
var slug = require('./slug');
var visibility = require('./propertyVisibility');

var postIdentity = {
  title: 'Post Identity',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    label: label()
  },
  additionalProperties: false
};

var getIdentitiesQuery = {
  title: 'Get Identities Query',
  type: 'object',
  properties: {},
  additionalProperties: true
};

var postIdentities = {
  title: 'Post Identities',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    type: {
      required: true,
      type: 'string',
      enum: ['Identity']
    },
    sysSlug: slug(),
    label: label(),
    website: {
      required: false,
      type: 'string'
    },
    description: {
      required: false,
      type: 'string'
    },
    sysPublic: {
      required: false,
      type: visibility()
    }
  },
  additionalProperties: false
};

var postPreferences = {
  title: 'Post Preferences',
  type: 'object',
  properties: {
    '@context': jsonldContext(),
    type: jsonldType('IdentityPreferences'),
    destination: identifier({required: false}),
    source: identifier({required: false}),
    publicKey: {
      required: false,
      type: [{
        // IRI only
        type: 'string'
      }, {
        // label+pem
        type: 'object',
        properties: {
          label: label(),
          publicKeyPem: publicKeyPem()
        }
      }]
    }
  },
  additionalProperties: false
};

module.exports.postIdentity = function() {
  return postIdentity;
};
module.exports.getIdentitiesQuery = function() {
  return getIdentitiesQuery;
};
module.exports.postIdentities = function() {
  return postIdentities;
};
module.exports.postPreferences = function() {
  return postPreferences;
};
