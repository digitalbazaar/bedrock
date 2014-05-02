var helper = require('./helper');

describe('util component', function() {
  beforeEach(function() {
    helper.get('/');
  });

  it('ellipsis should replace text', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('ellipsisFilter');
      return filter('abcdefg', 6);
    })).toEqual('abc...');
  });
});
