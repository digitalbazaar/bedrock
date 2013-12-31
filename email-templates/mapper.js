var fs = require('fs');

module.exports.map = function(mapping) {
  var ids = [
    'common.Profile.created',
    'common.Profile.created-profile',
    'common.Profile.passcodeSent'
  ];

  // FIXME: can't just map to filenames because swig can't use more than
  // one root directory, so the files must be loaded manually here
  ids.forEach(function(id) {
    var filename = __dirname + '/' + id + '.tpl';
    mapping[id] = {
      template: fs.readFileSync(filename).toString('utf8'),
      filename: filename
    };
  });
};
