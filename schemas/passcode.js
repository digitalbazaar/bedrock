var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Passcode',
  description: 'An auto-generated security code.',
  type: 'string',
  minLength: 8,
  maxLength: 8,
  errors: {
    invalid: 'The passcode must be 8 characters in length.',
    missing: 'Please enter a passcode.',
    masked: true
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
