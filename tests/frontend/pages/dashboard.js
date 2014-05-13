var helper = require('../helper.js');

var api = {};
module.exports = api;

var expect = GLOBAL.expect;
var ptor = GLOBAL.protractor.getInstance();

api.get = function(slug) {
  var url = '/i/' + slug + '/dashboard';
  helper.get(url);
  expect(ptor.getCurrentUrl()).to.eventually.equal(helper.baseUrl + url);
  return api;
};
