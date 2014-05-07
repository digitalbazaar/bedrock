var helper = require('../helper.js');

var api = {};
module.exports = api;

var browser = GLOBAL.browser;
var by = GLOBAL.by;
var element = GLOBAL.element;
var protractor = GLOBAL.protractor;

api.get = function() {
  helper.get('/join');
  return api;
};

api.createIdentity = function(options) {
  element(by.model('identity.email')).sendKeys(options.email);
  element(by.model('identity.sysPassword')).sendKeys(options.password);
  element(by.model('identity.label')).sendKeys(options.label);
  element(by.model('agreementChecked')).click();
  element(by.model('identity.sysSlug')).getAttribute('value')
    .then(function(slug) {
      var button = element(by.buttonText('Create Identity'));
      helper.waitForAttribute(button, 'disabled', function(disabled) {
        return disabled !== 'true';
      });
      element(by.buttonText('Create Identity')).click();
      helper.waitForUrl('/i/' + slug + '/dashboard');
      helper.waitForAngular();
    });
  return api;
};
