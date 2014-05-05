/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var api = {};
module.exports = api;

var browser;
var protractor;
var by;
var element;

// called by onPrepare in config script
api.init = function(options) {
  api.browser = options.browser;
  api.baseUrl = options.browser.baseUrl;
  api.protractor = options.protractor;
  api.element = options.element;

  browser = api.browser;
  protractor = api.protractor;
  by = protractor.By;
  element = api.element;
};

// gets a URL that returns an AngularJS page and waits for it to bootstrap
api.get = function(url) {
  // wait for ng-app to appear
  browser.driver.get(browser.baseUrl + url);
  browser.driver.wait(function() {
    var body = browser.driver.findElement(by.tagName(browser.rootEl));
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

// runs a script in the browser's context
// pass fn($injector) for a sync script, fn($injector, callback) for async
api.run = function(fn) {
  fn = fn.toString();
  var isAsync = (fn.split('\n')[0].indexOf(',') !== -1);
  var execute = isAsync ? browser.executeAsyncScript : browser.executeScript;
  return execute(
    "var $injector = angular.element('body').data('$injector');" +
    "var callback = arguments[arguments.length - 1];" +
    'return (' + fn + ')($injector, callback);');
};
