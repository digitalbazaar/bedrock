/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var browser;
var protractor;
var by;
var element;

function Helper() {
  EventEmitter.call(this);
}
util.inherits(Helper, EventEmitter);

var api = new Helper();
module.exports = api;

// called by onPrepare in config script
Helper.prototype.init = function(options) {
  this.browser = options.browser;
  this.baseUrl = options.browser.baseUrl;
  this.protractor = options.protractor;
  this.element = options.element;

  browser = this.browser;
  protractor = this.protractor;
  by = protractor.By;
  element = this.element;

  this.emit('init');
};

// gets a URL that returns an AngularJS page and waits for it to bootstrap
Helper.prototype.get = function(url) {
  // wait for ng-app to appear
  browser.driver.get(browser.baseUrl + url);
  browser.driver.wait(function() {
    var body = browser.driver.findElement(by.tagName(browser.rootEl));
    return body && body.getAttribute('ng-app');
  });
};

// logs in via the navbar
Helper.prototype.login = function(identifier, password) {
  this.get('/');
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
Helper.prototype.logout = function() {
  this.get('/');
  element(by.binding('model.session.identity.label')).click();
  element(by.linkText('Sign Out')).click();
  this.get('/');
};

// runs a script in the browser's context
// pass fn($injector) for a sync script, fn($injector, callback) for async
Helper.prototype.run = function(fn) {
  fn = fn.toString();
  var isAsync = (fn.split('\n')[0].indexOf(',') !== -1);
  var execute = isAsync ? browser.executeAsyncScript : browser.executeScript;
  return execute(
    "var $injector = angular.element('body').data('$injector');" +
    "var callback = arguments[arguments.length - 1];" +
    'return (' + fn + ')($injector, callback);');
};
