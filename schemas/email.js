/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Email',
  description: 'An email address.',
  type: 'string',
  pattern: "^[-a-zA-Z0-9~!$%^&*_=+}{\\'?]+(\\.[-a-zA-Z0-9~!$%^&*_=+}{\\'?]+)*@(((([a-zA-Z0-9]{1}[a-zA-Z0-9\\-]{0,62}[a-zA-Z0-9]{1})|[a-zA-Z])\\.)+[a-zA-Z]{2,6})$",
  minLength: 1,
  maxLength: 100,
  errors: {
    invalid: 'The email address is invalid.',
    missing: 'Please enter an email address.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
