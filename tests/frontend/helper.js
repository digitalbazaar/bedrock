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
  this.browser = browser = options.browser;
  this.baseUrl = options.browser.baseUrl;
  this.protractor = protractor = options.protractor;
  this.element = element = options.element;
  this.by = by = protractor.By;
  this.pages = require('./pages');

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

// logs in via the navbar
Helper.prototype.login = function(identifier, password) {
  this.pages.navbar.login(identifier, password);
};

// logs out via navbar
Helper.prototype.logout = function() {
  this.pages.navbar.logout();
};
