var helper = require('../helper.js');

var api = {};
module.exports = api;

var element;
var by;

helper.on('init', function() {
  element = helper.element;
  by = helper.by;
});

api.login = function(identifier, password) {
  helper.get('/');
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

api.logout = function() {
  helper.get('/');
  element(by.binding('model.session.identity.label')).click();
  element(by.linkText('Sign Out')).click();
  helper.get('/');
};
