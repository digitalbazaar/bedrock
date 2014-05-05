var helper = require('../helper');

describe('encodeURIComponent', function() {
  it('should URI encode the string http://foo.bar?baz=fuzz', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('encodeURIComponentFilter');
      return filter('http://foo.bar?baz=fuzz');
    })).toEqual('http%3A%2F%2Ffoo.bar%3Fbaz%3Dfuzz');
  });
});
