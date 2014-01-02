var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'URL',
  description: 'A universal resource location.',
  type: 'string',
  minLength: 1,
  errors: {
    invalid: 'Please enter a valid URL.',
    missing: 'Please enter a URL.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
