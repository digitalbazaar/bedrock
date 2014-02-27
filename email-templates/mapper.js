module.exports.map = function(mapping) {
  var ids = [
    'common.Profile.created',
    'common.Profile.created-profile',
    'common.Profile.passcodeSent'
  ];

  ids.forEach(function(id) {
    var filename = __dirname + '/' + id + '.tpl';
    mapping[id] = {filename: filename};
  });
};
