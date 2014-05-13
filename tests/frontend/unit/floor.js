var helper = require('../helper');

describe('floor', function() {
  beforeEach(function() {
    helper.waitForAngular();
  });

  it('should convert 1.128 to 1.12', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('floorFilter');
      return filter(1.128, 2);
    })).to.eventually.equal('1.12');
  });

  it('should convert 0.991 to 0.991', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('floorFilter');
      return filter(0.991, 3);
    })).to.eventually.equal('0.991');
  });

  it('should convert 0.991 to 0.9910', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('floorFilter');
      return filter('0.991', 4);
    })).to.eventually.equal('0.9910');
  });
});
