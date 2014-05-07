var helper = require('../helper');

describe('prefill', function() {
  beforeEach(function() {
    helper.waitForAngular();
  });

  it('should convert 1 to 01', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('prefillFilter');
      return filter('1');
    })).toEqual('01');
  });

  it('should convert 1 to a1', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('prefillFilter');
      return filter('1', 2, 'a');
    })).toEqual('a1');
  });

  it('should convert 1 to 001', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('prefillFilter');
      return filter('1', 3);
    })).toEqual('001');
  });
});
