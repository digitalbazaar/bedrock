var helper = require('../helper');

describe('mask', function() {
  beforeEach(function() {
    helper.waitForAngular();
  });

  it('should convert 12345 to *2345', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('maskFilter');
      return filter('12345');
    })).to.eventually.equal('*2345');
  });

  it('should convert 12345 to 2345', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('maskFilter');
      return filter('12345', 4);
    })).to.eventually.equal('2345');
  });

  it('should convert 12345 to ****2345', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('maskFilter');
      return filter('12345', 8);
    })).to.eventually.equal('****2345');
  });
});
