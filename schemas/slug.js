var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'Slug',
  description: 'A short identifier within a URL.',
  type: 'string',
  pattern: '^[a-z][-a-z0-9~_\\.]*$',
  minLength: 3,
  maxLength: 32,
  errors: {
    invalid: 'The slug must start with a letter, contain only lowercase ' +
      'letters, numbers, hyphens, periods, underscores, and tildes. It must ' +
      'between 3 and 32 characters in length.',
    missing: 'Please enter a slug.'
  }
};

module.exports = function(extend) {
  if(extend) {
    return tools.extend(true, tools.clone(schema), extend);
  }
  return schema;
};
