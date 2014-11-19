var helper = require('../helper');

describe('join', function() {
  var identity = {};
  identity.sysIdentifier = helper.randomString().toLowerCase();
  identity.id = helper.baseUrl + '/i/' + identity.sysIdentifier;
  identity.label = identity.sysIdentifier;
  identity.email = identity.sysIdentifier + '@bedrock.dev';
  identity.password = 'password';

  it('should create an identity and logout', function() {
    helper.pages.join.get().createIdentity(identity);
    helper.logout();
  });

  it('should login with the identity\'s slug', function() {
    helper.login(identity.sysIdentifier, identity.password);
  });

  it('should logout the identity', function() {
    helper.logout();
  });

  it('should login with the identity\'s email', function() {
    helper.login(identity.email, identity.password);
  });

  it('should logout the identity', function() {
    helper.logout();
  });
});
