/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require('../lib/bedrock/tools');

var schema = {
  required: true,
  title: 'Person Name',
  description: 'The name of a person.',
  type: 'string',
  pattern: '^\\S$|^\\S.*\\S$',
  minLength: 1,
  maxLength: 100,
  errors: {
    invalid: 'The name must not start or end with whitespace and must ' +
      'be between 1 and 100 characters in length.',
    missing: 'Please enter a name.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
