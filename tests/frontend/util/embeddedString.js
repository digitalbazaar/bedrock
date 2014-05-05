var helper = require('../helper');

describe('embeddedString', function() {
  it('should escape a string with carriage returns and line feeds', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('embeddedStringFilter');
      return filter('\r\n');
    })).toEqual('\\r\\n');
  });
});
