module.exports.map = function(mapping) {
  var ids = [
    'bedrock.Identity.created',
    'bedrock.Identity.created-identity',
    'bedrock.Identity.passcodeSent'
  ];

  ids.forEach(function(id) {
    var filename = __dirname + '/' + id + '.tpl';
    mapping[id] = {filename: filename};
  });
};
