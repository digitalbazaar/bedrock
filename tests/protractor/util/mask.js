var helper = require('../helper');

describe('mask', function() {
  it('should convert 12345 to *2345', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('maskFilter');
      return filter('12345');
    })).toEqual('*2345');
  });

  it('should convert 12345 to 2345', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('maskFilter');
      return filter('12345', 4);
    })).toEqual('2345');
  });

  it('should convert 12345 to ****2345', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('maskFilter');
      return filter('12345', 8);
    })).toEqual('****2345');
  });
});
