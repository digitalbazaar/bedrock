var helper = require('../helper.js');

var api = {};
module.exports = api;

var by = GLOBAL.by;
var element = GLOBAL.element;
var expect = GLOBAL.expect;

api.login = function(identifier, password) {
  helper.get('/');
  element.all(by.model('model.sysIdentifier')).each(function(e) {
    e.getTagName().then(function(tagName) {
      if(tagName === 'input') {
        e.sendKeys(identifier);
      }
    });
  });
  element(by.model('model.password')).sendKeys(password);
  element(by.linkText('Sign In')).click();
  helper.waitForUrl(function(url) {
    return url.indexOf('dashboard') !== -1;
  });
  helper.waitForAngular();
  return api;
};

api.logout = function() {
  helper.get('/');
  element(by.binding('model.session.identity.label')).click();
  element(by.linkText('Sign Out')).click();
  helper.get('/');
  expect(element(by.model('model.sysIdentifier')).isPresent())
    .to.eventually.be.true;
  return api;
};

api.refresh = function() {
  element(by.binding('model.session.identity.label')).click();
  element(by.linkText('Refresh')).click();
  return api;
};
