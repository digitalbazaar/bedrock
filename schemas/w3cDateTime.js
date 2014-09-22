/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var tools = require('../lib/bedrock/tools');

var schema = {
  required: true,
  title: 'W3C Date/Time',
  description: 'A W3C-formatted date and time combination.',
  type: 'string',
  pattern: '^[2-9][0-9]{3}-(0[1-9]|1[0-2])-([0-2][0-9]|3[0-1])T([0-1][0-9]|2[0-3]):([0-5][0-9]):(([0-5][0-9])|60)(\\.[0-9]+)?(Z|((\\+|-)([0-1][0-9]|2[0-3]):([0-5][0-9])))?$',
  errors: {
    invalid: 'The date/time must be of the W3C date/time format "YYYY-MM-DD( |T)HH:MM:SS.s(Z|(+|-)TZOFFSET)".',
    missing: 'Please enter a date/time.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
