var helper = require('../helper.js');

var api = {};
module.exports = api;

var by = GLOBAL.by;
var element = GLOBAL.element;
var expect = GLOBAL.expect;
var ptor = GLOBAL.protractor.getInstance();

api.get = function(slug) {
  var url = '/i/' + slug + '/settings';
  helper.get(url);
  expect(ptor.getCurrentUrl()).toEqual(helper.baseUrl + url);
  return api;
};

api.generateKey = function() {
  element(by.linkText('Keys')).click();
  element(by.popover('model.showKeysMenu')).click();
  element(by.linkText('Generate Key Pair')).click();
  var modal = element(by.modal());
  modal.element(by.partialButtonText('Generate Key')).click();
  var save = modal.element(by.partialButtonText('Save'));
  helper.waitForElement(save);
  save.click();
};
