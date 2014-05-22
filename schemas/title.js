/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(GLOBAL.__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Title',
  description: 'A descriptive title.',
  type: 'string',
  pattern: '^[-a-zA-Z0-9~!$%^&*\\(\\)_=+\\. ]*$',
  minLength: 1,
  maxLength: 32,
  errors: {
    invalid: 'The title contains invalid characters or is not between ' +
      '1 and 32 characters in length.',
    missing: 'Please enter a title.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
