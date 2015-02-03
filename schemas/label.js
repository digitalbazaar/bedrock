/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require('../lib/bedrock/tools');

var schema = {
  required: true,
  title: 'Label',
  description: 'A short, descriptive label.',
  type: 'string',
  pattern: '^[-a-zA-Z0-9~`!@#$%^&*\\(\\)\\[\\]{}<>_=+\\\\|:;\'\\.,/? ]*$',
  minLength: 1,
  maxLength: 32,
  errors: {
    invalid: 'The label contains invalid characters or is not between ' +
      '1 and 32 characters in length.',
    missing: 'Please enter a label.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
