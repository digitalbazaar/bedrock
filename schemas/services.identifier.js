/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var email = require('./email');
var slug = require('./slug');

var postIdentifier = {
  type: [{
    type: 'object',
    properties: {
      type: {
        required: true,
        type: 'string',
        enum: ['Profile', 'Identity']
      },
      sysSlug: slug()
    },
    additionalProperties: false
  }, {
    type: 'object',
    properties: {
      type: {
        required: true,
        type: 'string',
        enum: ['email']
      },
      email: email()
    },
    additionalProperties: false
  }]
};

module.exports.postIdentifier = function() {
  return postIdentifier;
};
