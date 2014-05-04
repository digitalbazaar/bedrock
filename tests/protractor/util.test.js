var helper = require('./helper');

describe('util component', function() {
  beforeEach(function() {
    helper.get('/');
  });

  describe('ellipsis', function() {
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

  describe('ceil', function() {
    it('should convert 1.123 to 1.13', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('ceilFilter');
        return filter(1.123, 2);
      })).toEqual('1.13');
    });

    it('should convert 0.991 to 1.00', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('ceilFilter');
        return filter(0.991, 2);
      })).toEqual('1.00');
    });

    it('should convert 0.991 to 0.9910', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('ceilFilter');
        return filter('0.991', 4);
      })).toEqual('0.9910');
    });
  });

  describe('embeddedString', function() {
    it('should escape a string with carriage returns and line feeds', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('embeddedStringFilter');
        return filter('\r\n');
      })).toEqual('\\r\\n');
    });
  });

  describe('encodeURIComponent', function() {
    it('should URI encode the string http://foo.bar?baz=fuzz', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('encodeURIComponentFilter');
        return filter('http://foo.bar?baz=fuzz');
      })).toEqual('http%3A%2F%2Ffoo.bar%3Fbaz%3Dfuzz');
    });
  });

  describe('floor', function() {
    it('should convert 1.128 to 1.12', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('floorFilter');
        return filter(1.128, 2);
      })).toEqual('1.12');
    });

    it('should convert 0.991 to 0.991', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('floorFilter');
        return filter(0.991, 3);
      })).toEqual('0.991');
    });

    it('should convert 0.991 to 0.9910', function() {
      expect(helper.run(function($injector) {
        var filter = $injector.get('floorFilter');
        return filter('0.991', 4);
      })).toEqual('0.9910');
    });
  });

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

  describe('prefill', function() {
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
});
