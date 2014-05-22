/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require(GLOBAL.__libdir + '/bedrock/tools');
var config = require(GLOBAL.__libdir + '/bedrock').config;

var schema = {
  required: true,
  title: 'JSON-LD context',
  description: 'A JSON-LD Context',
  type: [{
    type: 'string',
    enum: [config.constants.CONTEXT_URL]
  }, {
    type: 'object'
    // FIXME: improve context object validator
  }]
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
