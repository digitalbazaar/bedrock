/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var EventEmitter = require('events').EventEmitter;
var chai = require('chai');
var chaiAsPromised = require('chai-as-promised');
var util = require('util');
var _ = require('underscore');

chai.use(chaiAsPromised);
GLOBAL.expect = chai.expect;

var browser;
var by;

function Helper() {
  EventEmitter.call(this);
}
util.inherits(Helper, EventEmitter);

var api = new Helper();
module.exports = api;

// called by onPrepare in config script
Helper.prototype.init = function(options) {
  browser = GLOBAL.browser;
  by = GLOBAL.by;

  options = options || {};
  this.browser = browser;
  this.baseUrl = browser.baseUrl;
  this.selectors = require('./selectors');
  this.pages = require('./pages');

  if(GLOBAL.bedrock.config.test.frontend.hideBrowser) {
    // move window out of way (currently no way to minimize)
    browser.driver.manage().window().setPosition(-2000, 0);
  }

  this.get('/');
  this.emit('init');
};

// gets a URL that returns an AngularJS page and waits for it to bootstrap
Helper.prototype.get = function(url) {
  // wait for ng-app to appear
  browser.driver.get(this.baseUrl + url);
  this.waitForUrl(url);
  return this.waitForAngular();
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

// waits for AngularJS to be bootstrapped
Helper.prototype.waitForAngular = function() {
  return browser.driver.wait(function() {
    return browser.driver.isElementPresent(by.tagName(browser.rootEl))
      .then(function(present) {
        if(!present) {
          return false;
        }
        return browser.driver.findElement(by.tagName(browser.rootEl))
          .then(function(body) {
            return body.getAttribute('ng-app').then(function(value) {
              return !!value;
            });
          });
      });
  });
};

// waits for an element to be displayed
Helper.prototype.waitForElement = function(el) {
  return browser.wait(function() {
    return el.isDisplayed();
  });
};

// waits for an attribute to meet a certain criteria
Helper.prototype.waitForAttribute = function(el, attr, fn) {
  return browser.wait(function() {
    return el.getAttribute(attr).then(function(value) {
      return fn(value);
    });
  });
};

// waits for a particular URL to load
Helper.prototype.waitForUrl = function(url) {
  url = this.baseUrl + url;
  return browser.wait(function() {
    return browser.driver.getCurrentUrl().then(function(currentUrl) {
      return currentUrl === url;
    });
  });
};

// waits for a client-side script to return true
// eg: can check angular.element('.foo').scope().model.bar against some value
Helper.prototype.waitForScript = function(fn) {
  var self = this;
  return browser.wait(function() {
    return self.run(fn);
  });
};

// gets a random alphabetical string
Helper.prototype.randomString = function(length) {
  var idx_A = 'A'.charCodeAt(0);
  var idx_a = 'a'.charCodeAt(0) - 26;
  length = length || 10;
  var rval = '';
  while(rval.length < length) {
    var code = Math.floor(Math.random() * 52);
    code += (code < 26) ? idx_A : idx_a;
    rval += String.fromCharCode(code);
  }
  return rval;
};

// logs in via the navbar
Helper.prototype.login = function(identifier, password) {
  this.pages.navbar.login(identifier, password);
  return this;
};

// logs out via navbar
Helper.prototype.logout = function() {
  this.pages.navbar.logout();
  return this;
};

// uses AngularJS to format a date
Helper.prototype.formatDate = function(date, format) {
  return this.run(['function($injector, callback) {',
    'var filter = $injector.get("dateFilter");',
    'var date = new Date("' + date + '");',
    'var format = "' + format + '";',
    'return callback(filter(date, format));',
  '}'].join(''));
};

// performs a simple equality-based query on an array of items
Helper.prototype.find = function(items, query) {
  return Array.prototype.filter.call(items, _.matches(query));
};

// performs a simple equality-based query on an array of items
Helper.prototype.findOne = function(items, query) {
  items = this.find(items, query);
  if(items.length > 0) {
    return items[0];
  }
  return null;
};

api.on('init', function() {
  // locate elements by controller
  by.addLocator('controller', function(value, parent) {
    var using = parent || document;
    var query = "ng-controller='" + value + "']";
    query = '[' + query + ', [data-' + query;
    return using.querySelectorAll(query);
  });

  // locate elements via an attribute value
  by.addLocator('attribute', function(attr, value, parent) {
    if(arguments.length === 2) {
      parent = value;
      value = undefined;
    }
    var using = parent || document;
    var query = attr;
    if(typeof value !== 'undefined') {
      query += "='" + value + "'";
    }
    query += ']';
    query = '[' + query + ', [data-' + query;
    return using.querySelectorAll(query);
  });

  // locate popovers that are controlled by the given model var
  by.addLocator('popover', function(model, parent) {
    var using = parent || document;
    var query = "popover-visible='" + model + "']";
    query = '[' + query + ', [data-' + query;
    return using.querySelectorAll(query);
  });

  // locate the top-level modal
  by.addLocator('modal', function() {
    return document.querySelectorAll('.modal-wrapper > .modal');
  });

  // locate the top level modal footer
  by.addLocator('modalFooter', function() {
    return document.querySelectorAll('.modal-wrapper > .modal > .modal-footer');
  });

  // locate buttons to open a menu that contains an item with the given text
  by.addLocator('menuButtonForItem', function(value, parent) {
    value = value.trim();
    var using = parent || document;

    // get menu buttons
    var buttons = using.querySelectorAll('.dropdown-toggle');
    return Array.prototype.filter.call(buttons, function(button) {
      // if a menu the button opens has the item text, allow the button
      var menus = button.parentElement.querySelectorAll('.dropdown-menu');
      for(var mi = 0; mi < menus.length; ++mi) {
        var items = menus[mi].querySelectorAll('li > a');
        for(var ii = 0; ii < items.length; ++ii) {
          if(items[ii].textContent.trim() === value) {
            return true;
          }
        }
      }
      return false;
    });
  });

  // locate menu items with the given text
  by.addLocator('menuItem', function(value, parent) {
    value = value.trim();
    var using = parent || document;
    var items = using.querySelectorAll('.dropdown-menu > li > a');
    return Array.prototype.filter.call(items, function(item) {
      return item.textContent.trim() === value;
    });
  });

  // locate options from a select element by label (case-insensitive)
  by.addLocator('option', function(label, parent) {
    label = label.trim().toLowerCase();
    var using = parent || document;
    var options = using.querySelectorAll('option');
    return Array.prototype.filter.call(options, function(option) {
      return (option.textContent.trim().toLowerCase() === label);
    });
  });
});
