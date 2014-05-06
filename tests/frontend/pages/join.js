var helper = require('../helper.js');

var api = {};
module.exports = api;

var element = helper.element;
var by = helper.by;

api.createIdentity = function(options) {
  helper.get('/join');

  element(by.binding('identity.email')).sendKeys(options.email);
  element(by.binding('identity.sysPassword')).sendKeys(options.password);
  element(by.binding('identity.label')).sendKeys(options.label);

  element(by.linkText('Create Identity')).click();
};
