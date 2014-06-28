/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(GLOBAL.__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Description',
  description: 'A description.',
  type: 'string',
  pattern: '^[-a-zA-Z0-9~!@#$%^&*\\(\\)_=+\\\\|{}\\[\\];:\\\'"<>,./? ]*$',
  minLength: 0,
  maxLength: 1024,
  errors: {
    invalid: 'The description contains invalid characters or is more than ' +
      '1024 characters in length.',
    missing: 'Please enter a description.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
