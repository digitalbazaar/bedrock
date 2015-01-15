var helper = require('../helper');

describe('bytes', function() {
  beforeEach(function() {
    helper.waitForAngular();
  });

  it('should return "-" for NaN', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter('text');
    })).to.eventually.equal('-');
  });

  it('should round to two digits of precision', function() {
    expect(helper.run(function($injector) {
      var size = 1024 + 512;
      var filter = $injector.get('bytesFilter');
      return filter(size, 2);
    })).to.eventually.equal('1.50 KiB');
  });

  it('should output 1 byte', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(1, 0);
    })).to.eventually.equal('1 byte');
  });

  it('should output bytes', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(2, 0);
    })).to.eventually.equal('2 bytes');
  });

  it('should output KibiBytes', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(Math.pow(1024, 1), 0);
    })).to.eventually.equal('1 KiB');
  });

  it('should output MebiBytes', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(Math.pow(1024, 2), 0);
    })).to.eventually.equal('1 MiB');
  });

  it('should output GibiBytes', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(Math.pow(1024, 3), 0);
    })).to.eventually.equal('1 GiB');
  });

  it('should output TebiBytes', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(Math.pow(1024, 4), 0);
    })).to.eventually.equal('1 TiB');
  });

  it('should output PebiBytes', function() {
    expect(helper.run(function($injector) {
      var filter = $injector.get('bytesFilter');
      return filter(Math.pow(1024, 5), 0);
    })).to.eventually.equal('1 PiB');
  });
});
