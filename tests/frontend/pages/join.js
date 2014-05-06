var helper = require('../helper.js');

var api = {};
module.exports = api;

var by = GLOBAL.by;
var element = GLOBAL.element;

api.get = function() {
  helper.get('/join');
};

api.createIdentity = function(options) {
  element(by.binding('identity.email')).sendKeys(options.email);
  element(by.binding('identity.sysPassword')).sendKeys(options.password);
  element(by.binding('identity.label')).sendKeys(options.label);
  element(by.binding('agreementChecked')).click();
  element(by.linkText('Create Identity')).click();
};
