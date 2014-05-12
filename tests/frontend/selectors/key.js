var helper = require('../helper.js');
var selector = require('./selector.js');

var by = GLOBAL.by;
var element = GLOBAL.element;

var api = selector.create({add: add});
module.exports = api;

function add(options) {
  var modal = element(by.modal());
  modal.element(by.partialButtonText('Generate Key')).click();
  var save = modal.element(by.partialButtonText('Save'));
  helper.waitForElement(save);
  save.click();
};
