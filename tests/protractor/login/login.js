var helper = require('../helper');

describe('login component', function() {
  var ptor = protractor.getInstance();

  it('should login from the navbar', function() {
    helper.login('dev', 'password');
    helper.get('/i/dev/dashboard');
    expect(ptor.getCurrentUrl()).toEqual(helper.baseUrl + '/i/dev/dashboard');
  });

  it('should logout from the navbar', function() {
    helper.logout();
    expect(element(by.model('sysIdentifier')).isPresent()).toBe(true);
  });
});
