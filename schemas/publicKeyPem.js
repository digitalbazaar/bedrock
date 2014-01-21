/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Public Key PEM',
  description: 'A cryptographic Public Key in PEM format.',
  type: 'string',
  pattern: '^\\s*-----BEGIN PUBLIC KEY-----[a-zA-Z0-9/+=\\s]*-----END PUBLIC KEY-----\\s*$',
  errors: {
    invalid: 'The public key is not formatted correctly.',
    missing: 'The public key is missing.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
