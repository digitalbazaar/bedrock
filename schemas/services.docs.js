/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var getDocsQuery = {
  type: 'object',
  properties: {
    topic: {
      required: false,
      type: 'string',
      minLength: 1
    }
  }
};

module.exports.getDocsQuery = function() {
  return getDocsQuery;
};
