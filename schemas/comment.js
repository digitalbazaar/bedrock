/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require('../lib/bedrock/tools');

var schema = {
  required: true,
  title: 'Comment',
  description: 'A short comment.',
  type: 'string',
  minLength: 1,
  maxLength: 4000,
  errors: {
    invalid: 'The comment contains invalid characters or is more than ' +
      '4000 characters in length.',
    missing: 'Please enter a comment.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
