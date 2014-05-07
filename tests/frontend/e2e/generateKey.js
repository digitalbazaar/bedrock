var helper = require('../helper');

describe('generate key', function() {
  var sysIdentifier = helper.randomString().toLowerCase();
  var email = sysIdentifier + '@bedrock.dev';
  var password = 'password';

  it('should create a new user', function() {
    helper.pages.join.get().createIdentity({
      email: email,
      label: sysIdentifier,
      password: password
    });
  });

  it('should generate a key', function() {
    helper.pages.settings.get(sysIdentifier);
    element(by.linkText('Keys')).click();
    element(by.popover('model.showKeysMenu')).click();
  });

  it('should logout', function() {
    helper.logout();
  });
});
