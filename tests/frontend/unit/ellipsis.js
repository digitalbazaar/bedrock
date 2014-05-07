var helper = require('../helper');

describe('ellipsis', function() {
  beforeEach(function() {
    helper.waitForAngular();
  });

  it('should replace text with ...', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('ellipsisFilter');
      return filter('abcdefg', 6);
    })).toEqual('abc...');
  });

  it('should not replace text with ...', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('ellipsisFilter');
      return filter('abcdefg', 10);
    })).toEqual('abcdefg');
  });

  it('should show only ...', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('ellipsisFilter');
      return filter('abcdefg', 1);
    })).toEqual('...');
  });
});
