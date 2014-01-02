var email = require('./email');
var identifier = require('./identifier');
var slug = require('./slug');

var postIdentifier = {
  type: [{
    type: 'object',
    properties: {
      type: {
        required: true,
        type: 'string',
        enum: ['Profile', 'PersonalIdentity']
      },
      psaSlug: slug()
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
