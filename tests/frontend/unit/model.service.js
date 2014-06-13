var helper = require('../helper');

describe('model.service', function() {
  beforeEach(function() {
    helper.waitForAngular();
  });

  it('should replace an element in an array by id', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '1', data: 'foo'},
        {id: '2', data: 'bar'}
      ];
      var service = $injector.get('svcModel');
      service.replaceInArray(array, {id: '1', data: 'new foo'});
      return array;
    })).to.eventually.deep.equal([
      {id: '1', data: 'new foo'},
      {id: '2', data: 'bar'}
    ]);
  });

  it('should replace an element in an array by key', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '1', key: '2', data: 'foo'},
        {id: '2', key: '1', data: 'bar'}
      ];
      var service = $injector.get('svcModel');
      service.replaceInArray(
        array, {id: '1', key: '2', data: 'new foo'}, 'key');
      return array;
    })).to.eventually.deep.equal([
      {id: '1', key: '2', data: 'new foo'},
      {id: '2', key: '1', data: 'bar'}
    ]);
  });

  it('should replace an element in array by compare function', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '1', data: 'old foo'},
        {id: '2', data: 'old bar'}
      ];
      var service = $injector.get('svcModel');
      service.replaceInArray(
        array, {id: '1', data: 'new foo'}, function(dst, src) {
          return dst.id === '1';
        });
      return array;
    })).to.eventually.deep.equal([
      {id: '1', data: 'new foo'},
      {id: '2', data: 'old bar'}
    ]);
  });

  it('should replace an array\'s elements by id', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '1', data: 'old foo'},
        {id: '2', data: 'old bar'},
        {id: '4', data: 'remove'}
      ];
      var service = $injector.get('svcModel');
      service.replaceArray(
        array, [
          {id: '2', data: 'new bar'},
          {id: '1', data: 'new foo'},
          {id: '3', data: 'new'}
        ]);
      return array;
    })).to.eventually.deep.equal([
      {id: '2', data: 'new bar'},
      {id: '1', data: 'new foo'},
      {id: '3', data: 'new'}
    ]);
  });

  it('should replace an array\'s elements by key', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '1', key: '1', data: 'old foo'},
        {id: '2', key: '2', data: 'old bar'},
        {id: '4', key: '4', data: 'remove'}
      ];
      var service = $injector.get('svcModel');
      service.replaceArray(
        array, [
          {id: '2', key: '1', data: 'new bar'},
          {id: '1', key: '2', data: 'new foo'},
          {id: '3', key: '3', data: 'new'}
        ], 'key');
      return array;
    })).to.eventually.deep.equal([
      {id: '2', key: '1', data: 'new bar'},
      {id: '1', key: '2', data: 'new foo'},
      {id: '3', key: '3', data: 'new'}
    ]);
  });

  it('should replace an array\'s elements by compare function', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '1', key: '1', data: 'old foo'},
        {id: '2', key: '2', data: 'old bar'},
        {id: '4', key: '4', data: 'remove'}
      ];
      var service = $injector.get('svcModel');
      service.replaceArray(
        array, [
          {id: '2', key: '1', data: 'new bar'},
          {id: '1', key: '2', data: 'new foo'},
          {id: '3', key: '3', data: 'new'}
        ], function(element, candidate) {
          return element.key === candidate.key;
        });
      return array;
    })).to.eventually.deep.equal([
      {id: '2', key: '1', data: 'new bar'},
      {id: '1', key: '2', data: 'new foo'},
      {id: '3', key: '3', data: 'new'}
    ]);
  });

  it('should remove the first element from an array by id', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '0', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '2', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '1', data: 'remove'},
        {id: '3', data: 'keep'}
      ];
      var service = $injector.get('svcModel');
      service.removeFromArray({id: '1'}, array);
      return array;
    })).to.eventually.deep.equal([
      {id: '0', data: 'keep'},
      {id: '2', data: 'keep'},
      {id: '1', data: 'remove'},
      {id: '1', data: 'remove'},
      {id: '3', data: 'keep'}
    ]);
  });

  it('should remove all elements from an array by id', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '0', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '2', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '1', data: 'remove'},
        {id: '3', data: 'keep'}
      ];
      var service = $injector.get('svcModel');
      service.removeAllFromArray({id: '1'}, array);
      return array;
    })).to.eventually.deep.equal([
      {id: '0', data: 'keep'},
      {id: '2', data: 'keep'},
      {id: '3', data: 'keep'}
    ]);
  });

  it('should remove the first element from an array by key', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '0', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '2', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '1', data: 'remove'},
        {id: '3', data: 'keep'}
      ];
      var service = $injector.get('svcModel');
      service.removeFromArray({data: 'remove'}, array, 'data');
      return array;
    })).to.eventually.deep.equal([
      {id: '0', data: 'keep'},
      {id: '2', data: 'keep'},
      {id: '1', data: 'remove'},
      {id: '1', data: 'remove'},
      {id: '3', data: 'keep'}
    ]);
  });

  it('should remove all elements from an array by key', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '0', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '2', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '1', data: 'remove'},
        {id: '3', data: 'keep'}
      ];
      var service = $injector.get('svcModel');
      service.removeAllFromArray({data: 'remove'}, array, 'data');
      return array;
    })).to.eventually.deep.equal([
      {id: '0', data: 'keep'},
      {id: '2', data: 'keep'},
      {id: '3', data: 'keep'}
    ]);
  });

  it('should remove the first element from an array by compare function', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '0', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '2', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '1', data: 'remove'},
        {id: '3', data: 'keep'}
      ];
      var service = $injector.get('svcModel');
      service.removeFromArray(array, function(e) {
        return e.id === '1';
      });
      return array;
    })).to.eventually.deep.equal([
      {id: '0', data: 'keep'},
      {id: '2', data: 'keep'},
      {id: '1', data: 'remove'},
      {id: '1', data: 'remove'},
      {id: '3', data: 'keep'}
    ]);
  });

  it('should remove all elements from an array by compare function', function() {
    expect(helper.run(function($injector) {
      var array = [
        {id: '0', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '2', data: 'keep'},
        {id: '1', data: 'remove'},
        {id: '1', data: 'remove'},
        {id: '3', data: 'keep'}
      ];
      var service = $injector.get('svcModel');
      service.removeAllFromArray(array, function(e) {
        return e.id === '1';
      });
      return array;
    })).to.eventually.deep.equal([
      {id: '0', data: 'keep'},
      {id: '2', data: 'keep'},
      {id: '3', data: 'keep'}
    ]);
  });

});
