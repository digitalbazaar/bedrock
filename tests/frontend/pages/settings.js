var helper = require('../helper.js');

var api = {};
module.exports = api;

var by = GLOBAL.by;
var element = GLOBAL.element;
var expect = GLOBAL.expect;
var ptor = GLOBAL.protractor.getInstance();

api.get = function(slug) {
  var url = '/i/' + slug + '/settings';
  helper.get(url);
  expect(ptor.getCurrentUrl()).to.eventually.equal(helper.baseUrl + url);
  return api;
};

api.generateKey = function(options) {
  options = options || {};
  element(by.linkText('Keys')).click();
  element(by.popover('model.showKeysMenu')).click();
  element(by.linkText('Generate Key Pair')).click();
  var modal = element(by.modal());
  modal.element(by.partialButtonText('Generate Key')).click();
  var save = modal.element(by.partialButtonText('Save'));
  helper.waitForElement(save);
  if(options.label) {
    modal.element(by.model('model.key.label')).clear();
    modal.element(by.model('model.key.label')).sendKeys(options.label);
  }
  save.click();
};

api.revokeKey = function(options) {
  element(by.linkText('Keys')).click();
  api.getKeys().then(function(keys) {
    // support look up by id or label
    var i;
    var key;
    var prop = options.id ? 'id' : 'label';
    for(i = 0; i < keys.length; ++i) {
      if(keys[i][prop] === options[prop]) {
        key = keys[i];
        break;
      }
    }
    expect(key).to.exist;
    var row = element(by.repeater('key in keys').row(i));
    row.element(by.popover('model.showKeysActionMenu_' + i)).click();
    element(by.linkText('Revoke')).click();
    var modal = element(by.modal());
    modal.element(by.partialButtonText('Revoke')).click();
    return api.getKey('id', key.id);
  }).then(function(key) {
    expect(key).to.exist;
    expect(key.revoked).to.exist;
  });
};

api.getKeys = function() {
  return element(by.controller('KeysCtrl')).evaluate('keys');
};

api.getKey = function(property, value) {
  return api.getKeys().then(function(keys) {
    for(var i = 0; i < keys.length; ++i) {
      var key = keys[i];
      if(key[property] === value) {
        return key;
      }
    }
    return null;
  });
};
