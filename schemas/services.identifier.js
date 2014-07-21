/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var email = require('./email');
var slug = require('./slug');

var postEmailIdentifier = {
  type: 'object',
  properties: {
    email: email()
  },
  additionalProperties: false
};

var postIdentityIdentifier = {
  type: 'object',
  properties: {
    sysSlug: slug()
  },
  additionalProperties: false
};

module.exports.postEmailIdentifier = function() {
  return postEmailIdentifier;
};
module.exports.postIdentityIdentifier = function() {
  return postIdentityIdentifier;
};
