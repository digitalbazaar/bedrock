var helper = require('../helper');

describe('revoke key', function() {
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
    helper.pages.settings.get(sysIdentifier).generateKey({label: 'To Revoke'});
  });

  it('should revoke a key', function() {
    helper.pages.settings.get(sysIdentifier).revokeKey({label: 'To Revoke'});
  });

  it('should logout', function() {
    helper.logout();
  });
});
