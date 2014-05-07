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
      browser.wait(function() {
        var button = element(by.buttonText('Create Identity'));
        return button.getAttribute('disabled').then(function(disabled) {
          return disabled !== 'true';
        });
      });
      element(by.buttonText('Create Identity')).click();
      var ptor = protractor.getInstance();
      browser.wait(function() {
        var url = '/i/' + slug + '/dashboard';
        return ptor.getCurrentUrl().then(function(currentUrl) {
          return currentUrl === (helper.baseUrl + url);
        });
      });
    });
  return api;
};
