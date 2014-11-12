var by = GLOBAL.by;
var element = GLOBAL.element;
var expect = GLOBAL.expect;

var api = {};
module.exports = api;

/**
 * Creates a selector w/customizable behavior.
 *
 * @param options the options to use.
 *          add(options) called when the add modal is open.
 *
 * @return the selector.
 */
api.create = function(options) {
  var selector = {};
  var add = options.add;

  selector.create = function(options) {
    var el = options.element.element(by.css('br-selector'));
    var change = el.element(by.partialButtonText('Change'));
    var modal;
    change.isDisplayed().then(function(shown) {
      if(shown) {
        // change modal
        change.click();
        modal = element(by.modal());
        modal.element(by.partialButtonText('Add')).click();

        // add modal
        add(options);
      } else {
        // add modal
        el.element(by.partialButtonText('Add')).click();
        add(options);
      }
    });
    return selector;
  };

  selector.select = function(options) {
    var el = options.element.element(by.tagName('br-selector'));
    el.evaluate('selected').then(function(selected) {
      // already selected
      if(selected && selected.id === options.id) {
        return;
      }

      // change option must be available to select proper item
      var change = el.element(by.partialButtonText('Change'));
      expect(change.isDisplayed()).to.be.true;

      // change modal
      change.click();
      var choices = element(by.modal()).element(
        by.attribute('name', 'br-selector-choices'));
      var toSelect = null;
      choices.all(by.repeater(options.repeater)).then(function(rows) {
        rows.forEach(function(row) {
          row.evaluate(options.itemName).then(function(selected) {
            if(selected.id === options.id) {
              toSelect = row;
            }
          });
        });
      }).then(function() {
        toSelect.click();
      });
    });
    return selector;
  };

  return selector;
};
