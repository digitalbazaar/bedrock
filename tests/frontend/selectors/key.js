var helper = require('../helper.js');

var api = {};
module.exports = api;

var expect = GLOBAL.expect;
var ptor = GLOBAL.protractor.getInstance();

// TODO: much of the selector code could be potentially abstracted and reused
api.create = function(options) {
  var el = options.element.element(by.attribute('selector'));
  var change = el.element(by.partialButtonText('Change'));
  var modal;
  change.isDisplayed().then(function(shown) {
    if(shown) {
      // change modal
      change.click();
      modal = element(by.modal());
      modal.element(by.partialButtonText('Add')).click();

      // add modal
      modal = element(by.modal());
      modal.element(by.partialButtonText('Generate Key')).click();
      var save = modal.element(by.partialButtonText('Save'));
      helper.waitForElement(save);
      save.click();

      // back to change modal
      modal = element(by.modal());
      modal.element.all(by.repeater('selected in')).last().click();
      GLOBAL.browser.sleep(2000);
    } else {
      // add modal
      el.element(by.partialButtonText('Add')).click();
      modal = element(by.modal());
      modal.element(by.partialButtonText('Generate Key')).click();
      var save = modal.element(by.partialButtonText('Save'));
      helper.waitForElement(save);
      save.click();
    }
  });
  return api;
};

api.select = function(options) {
  var el = options.element.element(by.attribute('selector'));
  el.evaluate('selected').then(function(selected) {
    if(selected && selected.id === options.key) {
      return;
    }

    el.element(by.partialButtonText('Change')).click();
    GLOBAL.browser.sleep(2000);
    var modal = element(by.modal());
    var toSelect = null;
    modal.element.all(by.repeater('selected in')).then(function(rows) {
      rows.forEach(function(row) {
        row.evaluate('selected').then(function(selected) {
          if(selected.id === options.key) {
            toSelect = row;
          }
        });
      });
    }).then(function() {
      toSelect.click();
    });
  });
  return api;
};
