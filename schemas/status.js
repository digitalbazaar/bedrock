/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Status',
  description: 'A status setting.',
  type: 'string',
  enum: ['active', 'disabled', 'deleted'],
  errors: {
    invalid: 'Only "active", "disabled", or "deleted" are permitted.',
    missing: 'Please enter a status.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
