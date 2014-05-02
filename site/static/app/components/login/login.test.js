describe('login component', function() {
  var ptor = protractor.getInstance();
  var app = browser.app;

  it('should login from the navbar', function() {
    app.login('dev', 'password');
    app.get('/i/dev/dashboard');
    expect(ptor.getCurrentUrl()).toEqual(app.baseUrl + '/i/dev/dashboard');
  });

  it('should logout from the navbar', function() {
    app.logout();
    expect(element(by.model('sysIdentifier')).isPresent()).toBe(true);
  });
});
