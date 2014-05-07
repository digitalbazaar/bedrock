var helper = require('../helper.js');

var api = {};
module.exports = api;

var expect = GLOBAL.expect;
var ptor = GLOBAL.protractor.getInstance();

api.get = function(slug) {
  var url = '/i/' + slug + '/settings';
  helper.get(url);
  expect(ptor.getCurrentUrl()).toEqual(helper.baseUrl + url);
  return api;
};
