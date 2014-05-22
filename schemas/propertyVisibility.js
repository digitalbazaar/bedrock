/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(GLOBAL.__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Property Visibility',
  description: 'A list of object property IRIs that are publicly visible.',
  type: 'array',
  uniqueItems: true,
  items: {
    type: 'string',
    enum: [
      'owner',
      'label'
    ]
  },
  errors: {
    invalid: 'Only "owner" and "label" are permitted.',
    missing: 'Please enter the properties that should be publicly visible.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
