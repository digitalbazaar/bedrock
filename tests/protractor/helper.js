/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var api = {};
module.exports = api;

var browser;
var protractor;
var by;
var element;

// callbed by onPrepare in config script
api.init = function(options) {
  api.browser = options.browser;
  api.protractor = options.protractor;
  api.baseUrl = options.baseUrl;
  api.rootElement = options.rootElement;
  api.element = options.element;

  browser = api.browser;
  protractor = api.protractor;
  by = protractor.By;
  element = api.element;
};

// gets a URL that returns an AngularJS page and waits for it to bootstrap
api.get = function(url) {
  // wait for ng-app to appear
  browser.driver.get(api.baseUrl + url);
  browser.driver.wait(function() {
    var body = browser.driver.findElement(by.tagName(api.rootElement));
    return body && body.getAttribute('ng-app');
  });
};

// logs in via the navbar
api.login = function(identifier, password) {
  api.get('/');
  element.all(by.model('sysIdentifier')).each(function(e) {
    e.getTagName().then(function(tagName) {
      if(tagName === 'input') {
        e.sendKeys(identifier);
      }
    });
  });
  element(by.model('password')).sendKeys(password);
  element(by.linkText('Sign In')).click();
};

// logs out via navbar
api.logout = function() {
  api.get('/');
  element(by.binding('model.session.identity.label')).click();
  element(by.linkText('Sign Out')).click();
  api.get('/');
};
