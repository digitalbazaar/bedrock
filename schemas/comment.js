/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Comment',
  description: 'A short comment.',
  type: 'string',
  pattern: '^[-a-zA-Z0-9~!@#$%^&*\\(\\)_=+\\\\|{}\\[\\];:\\\'"<>,./? ]*$',
  minLength: 1,
  maxLength: 256,
  errors: {
    invalid: 'The comment contains invalid characters or is more than ' +
      '256 characters in length.',
    missing: 'Please enter a comment.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
