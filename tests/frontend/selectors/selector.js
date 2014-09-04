var by = GLOBAL.by;
var element = GLOBAL.element;

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
    var el = options.element.element(by.css('brSelector'));
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

        // back to change modal
        modal = element(by.modal());
        modal.all(by.repeater('selected in')).last().click();
      } else {
        // add modal
        el.element(by.partialButtonText('Add')).click();
        add(options);
      }
    });
    return selector;
  };

  selector.select = function(options) {
    var el = options.element.element(by.css('brSelector'));
    el.evaluate('brSelector.selected').then(function(selected) {
      if(selected && selected.id === options.id) {
        return;
      }

      el.element(by.partialButtonText('Change')).click();
      var choices = element(by.modal()).element(by.css('.br-selector-choices'));
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
