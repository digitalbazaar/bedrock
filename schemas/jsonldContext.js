var tools = require(__libdir + '/bedrock/tools');

var schema = {
  required: true,
  title: 'JSON-LD context',
  description: 'A JSON-LD Context',
  type: [{
    type: 'string',
    pattern: '^https://w3id.org/bedrock/v1$'
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
