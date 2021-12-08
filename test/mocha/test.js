/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const bedrock = require('bedrock');
const {util: {BedrockError}} = bedrock;

describe('bedrock', function() {
  describe('util.extend()', function() {
    it('should perform in-place default extension', function(done) {
      const result = {};
      bedrock.util.extend(result, {a: 1});
      result.should.eql({a: 1});
      done();
    });
    it('should perform in-place deep extension', function(done) {
      const result = {a: {a0: 0}, b: 2};
      bedrock.util.extend(true, result, {a: {a1: 1}});
      result.should.eql({a: {a0: 0, a1: 1}, b: 2});
      done();
    });
    it('should perform in-place shallow extension', function(done) {
      const result = {a: {a0: 0}, b: 2};
      bedrock.util.extend(false, result, {a: {a1: 1}});
      result.should.eql({a: {a1: 1}, b: 2});
      done();
    });
    it('should be able to return a new object', function(done) {
      const result = bedrock.util.extend(true, {}, {a: 1});
      result.should.eql({a: 1});
      done();
    });
    it('should merge multiple objects into a new object', function(done) {
      const result = {};
      bedrock.util.extend(true, result, {a: 1}, {b: 2});
      result.should.eql({a: 1, b: 2});
      done();
    });
  });

  describe('util.BedrockError', function() {
    it('should have correct type', function(done) {
      const err = new BedrockError('E', 'TYPE', null, null);
      err.isType('BOGUS').should.be.false;
      err.isType('TYPE').should.be.true;
      err.hasType('BOGUS').should.be.false;
      err.hasType('TYPE').should.be.true;
      done();
    });
    it('should have correct cause', function(done) {
      const err0 = new BedrockError('E0', 'E0TYPE', null, null);
      const err1 = new BedrockError('E1', 'E1TYPE', null, err0);
      err1.isType('BOGUS').should.be.false;
      err1.isType('E1TYPE').should.be.true;
      err1.hasType('BOGUS').should.be.false;
      err1.hasType('E0TYPE').should.be.true;
      err1.hasType('E1TYPE').should.be.true;
      done();
    });
  });

  describe('util.config', function() {
    // simplify most tests with common config setup
    let config;
    let c;
    let cc;
    beforeEach('create config', function() {
      config = {
        // 'base' used for path testing
        base: {}
      };
      const options = {
        // set locals to our custom config root
        locals: config
      };
      c = new bedrock.util.config.Config(config, options);
      cc = c.computer();
    });

    describe('basic set functionality', function() {
      it('should create', function() {
        config.base.a = 'a';
        config.base.b = 'b';
        c.set('nopath', 'nopath');
        config.nopath.should.equal('nopath');
        c.set('path.path', 'path');
        config.path.path.should.equal('path');
        c.set(['array', 'path'], 'arraypath');
        config.array.path.should.equal('arraypath');
      });
      it('should update', function() {
        config.data = 'js';
        config.data.should.equal('js');
        c.set('data', 'set');
        config.data.should.equal('set');
        c.set('data', 'updated');
        config.data.should.equal('updated');
        config.data = 'js updated';
        config.data.should.equal('js updated');
      });
      it('should multi-set', function() {
        c.set({
          'base.a': 'a',
          'base.b': 'b'
        });
        config.base.a.should.equal('a');
        config.base.b.should.equal('b');
      });
    });

    describe('basic setDefault functionality', function() {
      it('should setDefault when exists', function() {
        (typeof config.p1).should.equal('undefined');
        const object = c.setDefault('p1', {});
        config.p1.should.equal(object);
        Object.keys(object).length.should.equal(0);
      });
      it('should setDefault when does not exist', function() {
        config.p1 = {};
        config.p1.exists = true;
        config.p1.exists.should.equal(true);
        const object = c.setDefault('p1', {});
        config.p1.should.equal(object);
        config.p1.should.equal(config.p1);
        config.p1.exists.should.equal(true);
      });
      it('should setDefault paths', function() {
        (typeof config.p1).should.equal('undefined');
        const object = c.setDefault('p1.p2', {});
        config.p1.p2.should.equal(object);
        Object.keys(config.p1).length.should.equal(1);
        Object.keys(config.p1.p2).length.should.equal(0);
      });
      it('should setDefault array paths', function() {
        (typeof config.p1).should.equal('undefined');
        const object = c.setDefault(['p1', 'p2'], {});
        config.p1.p2.should.equal(object);
        Object.keys(config.p1).length.should.equal(1);
        Object.keys(config.p1.p2).length.should.equal(0);
      });
      it('should multi-setDefault', function() {
        config.p3 = {};
        (typeof config.p1).should.equal('undefined');
        (typeof config.p2).should.equal('undefined');
        (typeof config.p3).should.equal('object');
        Object.keys(config.p3).length.should.equal(0);
        const object = c.setDefault({
          p1: {},
          'p2.c1': {},
          'p3.c1': {}
        });
        config.p1.should.equal(object.p1);
        Object.keys(config.p1).length.should.equal(0);
        config.p2.c1.should.equal(object['p2.c1']);
        Object.keys(config.p2).length.should.equal(1);
        Object.keys(config.p2.c1).length.should.equal(0);
        config.p3.c1.should.equal(object['p3.c1']);
        Object.keys(config.p3).length.should.equal(1);
        Object.keys(config.p3.c1).length.should.equal(0);
      });
    });

    describe('basic computed functionality', function() {
      it('should create', function() {
        config.base.a = 'a';
        config.base.b = 'b';
        cc('computed', () => config.base.a + config.base.b);
        config.computed.should.equal('ab');
      });
      it('should update', function() {
        config.base.a = 'a';
        config.base.b = 'b';
        cc('computed', () => config.base.a + config.base.b);
        config.computed.should.equal('ab');
        config.base.a = 'a2';
        config.base.b = 'b2';
        config.computed.should.equal('a2b2');
      });
      it('should multi-compute', function() {
        cc({
          'mod.name': 'NAME',
          'mod.id': 1234,
          'computed.f': () => config.mod.name + '-' + config.mod.id,
          'computed.t': '${mod.name}-${mod.id}'
        });
        config.mod.name.should.equal('NAME');
        config.mod.id.should.equal(1234);
        config.computed.f.should.equal('NAME-1234');
        config.computed.t.should.equal('NAME-1234');
      });
      it('should multi-compute options', function() {
        // require the container exists so locals option works
        c.setDefault('mod', {});
        cc({
          'mod.name': 'NAME',
          'mod.id': 1234,
          'computed.f': () => config.mod.name + '-' + config.mod.id,
          'computed.t': '${name}-${id}'
        }, {locals: config.mod});
        config.mod.name.should.equal('NAME');
        config.mod.id.should.equal(1234);
        config.computed.f.should.equal('NAME-1234');
        config.computed.t.should.equal('NAME-1234');
      });
    });

    describe('basic array functionality', function() {
      it('should create empty', function() {
        c.set('a', []);
        config.a.should.be.an('array');
        config.a.length.should.equal(0);
      });
      it('should create with simple values', function() {
        c.set('a', ['a', 'b']);
        config.a.should.be.an('array');
        config.a.length.should.equal(2);
        config.a[0].should.equal('a');
        config.a[1].should.equal('b');
      });
      it('should set computed values', function() {
        config.a = ['a', 'b'];
        c.setComputed('a[2]', '${a[0] + a[1]}');
        config.a.should.be.an('array');
        config.a.length.should.equal(3);
        config.a[0].should.equal('a');
        config.a[1].should.equal('b');
        config.a[2].should.equal('ab');
      });
      it('should create with computed values', function() {
        c.setComputed({
          'a[0]': 'a',
          'a[1]': 'b',
          'a[2]': '${a[0] + a[1]}'
        }, {parentDefault: []});
        config.a.should.be.an('array');
        config.a.length.should.equal(3);
        config.a[0].should.equal('a');
        config.a[1].should.equal('b');
        config.a[2].should.equal('ab');
      });
      it('should update with computed values', function() {
        config.a = [];
        c.setComputed({
          'a[0]': 'a',
          'a[1]': 'b',
          'a[2]': '${a[0] + a[1]}'
        });
        config.a.should.be.an('array');
        config.a.length.should.equal(3);
        config.a[0].should.equal('a');
        config.a[1].should.equal('b');
        config.a[2].should.equal('ab');
      });
      it('should push to array', function() {
        c.pushComputed('a', 'a');
        config.a.should.be.an('array');
        config.a.length.should.equal(1);
        config.a[0].should.equal('a');
      });
      it('should push computed values', function() {
        config.a = [];
        c.pushComputed('a', 'a');
        c.pushComputed('a', 'b');
        c.pushComputed('a', '${a[0] + a[1]}');
        c.pushComputed('a', () => config.a[0] + config.a[1]);
        config.a.should.be.an('array');
        config.a.length.should.equal(4);
        config.a[0].should.equal('a');
        config.a[1].should.equal('b');
        config.a[2].should.equal('ab');
        config.a[3].should.equal('ab');
      });
    });

    describe('default config', function() {
      // computed config for main config
      const _cc = bedrock.util.config.main.computer();

      // ensure empty config container
      beforeEach('create config', function() {
        bedrock.config._mocha = {};
      });
      // clean up test config
      afterEach('remove config', function() {
        delete bedrock.config._mocha;
      });

      it('should use default config', function() {
        const config = bedrock.config;
        config._mocha.a = 'a';
        config._mocha.b = 'b';
        _cc('_mocha.computed', () => config._mocha.a + config._mocha.b);
        bedrock.config._mocha.computed.should.equal('ab');
      });
    });

    describe('templates', function() {
      it('should create', function() {
        const _options = {locals: config};
        const _cc = new bedrock.util.config.Config(config, _options).computer();
        config.base.a = 'a';
        config.base.b = 'b';
        _cc('computed', '${base.a + base.b}', _options);
        config.computed.should.equal('ab');
      });
      it('should create with custom locals', function() {
        const _options = {locals: config.base};
        const _cc = new bedrock.util.config.Config(config, _options).computer();
        config.base.a = 'a';
        config.base.b = 'b';
        _cc('computed', '${a + b}');
        config.computed.should.equal('ab');
      });
      it('should create with per-call locals', function() {
        const _options = {locals: config.base};
        const _cc = new bedrock.util.config.Config(config).computer();
        config.base.a = 'a';
        config.base.b = 'b';
        _cc('computed', '${a + b}', _options);
        config.computed.should.equal('ab');
      });
      it('should update', function() {
        const _options = {locals: config};
        const _cc = new bedrock.util.config.Config(config, _options).computer();
        config.base.a = 'a';
        config.base.b = 'b';
        _cc('computed', '${base.a + base.b}');
        config.computed.should.equal('ab');
        config.base.a = 'a2';
        config.base.b = 'b2';
        config.computed.should.equal('a2b2');
      });
    });

    describe('ints', function() {
      it('should support int function', function() {
        config.a = 1;
        config.b = 2;
        cc('computed', () => config.a + config.b);
        config.computed.should.equal(3);
      });
      it('should support int template', function() {
        config.a = 1;
        config.b = 2;
        cc('computed', '${a + b}');
        // will compute with ints but output string
        config.computed.should.equal('3');
      });
      it('should support int computed values', function() {
        cc('notcomputed', 123);
        config.notcomputed.should.equal(123);
      });
    });

    describe('double computed', function() {
      it('should create two computed configs', function() {
        config.a = 'a';
        config.b = 'b';
        cc('computed', () => config.a + config.b);
        cc('computed2', () => config.computed + config.computed);
        config.computed2.should.equal('abab');
      });
      it('should update two computed configs', function() {
        config.a = 'a';
        config.b = 'b';
        cc('computed', () => config.a + config.b);
        cc('computed2', () => config.computed + config.computed);
        config.computed2.should.equal('abab');
        config.a = 'a2';
        config.b = 'b2';
        config.computed2.should.equal('a2b2a2b2');
      });
    });

    describe('override', function() {
      it('should create twice', function() {
        cc('computed', 'computed');
        cc('computed', 'computed2');
        config.computed.should.equal('computed2');
      });
    });

    describe('js functionality', function() {
      it('should support assignment', function() {
        cc('computed', 'computed');
        config.computed.should.equal('computed');
        config.computed = 'computed2';
        config.computed.should.equal('computed2');
      });
      it('should support "delete"', function() {
        cc('computed', 'computed');
        config.computed.should.equal('computed');
        delete config.computed;
        (typeof config.computed).should.equal('undefined');
      });
      it('should support "in"', function() {
        cc('computed', 'computed');
        ('computed' in config).should.be.true;
      });
      it('should support JSON serialization', function() {
        // clear config first for repeatable serialization
        delete config.base;
        cc('computed', 'computed');
        config.computed.should.equal('computed');
        JSON.stringify(config).should.equal('{"computed":"computed"}');
      });
    });

    describe('paths', function() {
      it('should support dotted paths', function() {
        cc('hostname', 'www.example.com');
        cc('computed.base', 'https://${hostname}');
        cc('computed.endpoint', '${computed.base}/endpoint');
        config.hostname.should.equal('www.example.com');
        config.computed.base.should.equal('https://www.example.com');
        config.computed.endpoint.should.equal(
          'https://www.example.com/endpoint');
      });
      it('should support complex dotted paths', function() {
        // [name] indexing
        cc('a1[b1-c1].d1', 'e1');
        config.a1['b1-c1'].d1.should.equal('e1');
        // [dotted name] indexing
        cc('a2[\'b2.c2\'].d2', 'e2');
        config.a2['b2.c2'].d2.should.equal('e2');
        cc('a3["b3.c3"].d3', 'e3');
        config.a3['b3.c3'].d3.should.equal('e3');
        // dotted names
        cc('a4.b4.c4.d4', 'e4');
        config.a4.b4.c4.d4.should.equal('e4');
        // top level dotted name expands
        cc('[a5.b5]', 'c5');
        config.a5.b5.should.equal('c5');
        // quoted top level dotted name
        cc('[\'a6.b6\']', 'c6');
        config['a6.b6'].should.equal('c6');
        cc('["a7.b7"]', 'c7');
        config['a7.b7'].should.equal('c7');
        // result of confusing quoting
        cc('\'a8.b8\'', 'c8');
        config['\'a8']['b8\''].should.equal('c8');
        // non dot names
        cc('a9.b9-c9.d9', 'e9');
        config.a9['b9-c9'].d9.should.equal('e9');
        // array paths
        cc(['a10', 'b10', 'c10'], 'd10');
        config.a10.b10.c10.should.equal('d10');
      });
    });

    describe('README examples', function() {
      it('should support set', function() {
        c.set('server.port', 8443);

        config.server.port.should.equal(8443);
      });

      it('should support setDefault', function() {
        c.setDefault('accounts.admin', {});
        config.accounts.admin.name = 'Ima Admin';
        c.set('accounts.admin.id', 1);
        const account123 = c.setDefault('accounts.account123', {});
        account123.id = 123;
        account123.name = 'Account 123';

        config.accounts.admin.name.should.equal('Ima Admin');
        config.accounts.admin.id.should.equal(1);
        config.accounts.account123.id.should.equal(123);
        config.accounts.account123.name.should.equal('Account 123');
      });

      it('should support setComputed', function() {
        c.set('server.port', 8443);
        c.set('server.domain', 'bedrock.dev');
        c.setComputed('server.host', () => {
          return config.server.domain + ':' + config.server.port;
        });

        config.server.port.should.equal(8443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.host.should.equal('bedrock.dev:8443');
      });

      it('should support setComputed2', function() {
        c.set('server.port', 8443);
        c.set('server.domain', 'bedrock.dev');
        c.setComputed('server.host', () => {
          if(config.server.port !== 443) {
            return config.server.domain + ':' + config.server.port;
          }
          return config.server.domain;
        });

        config.server.port.should.equal(8443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.host.should.equal('bedrock.dev:8443');
        c.set('server.port', 443);
        config.server.port.should.equal(443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.host.should.equal('bedrock.dev');
      });

      it('should support computer', function() {
        c.set('server.port', 8443);
        c.set('server.domain', 'bedrock.dev');
        cc('server.host', () => {
          // only add the port if it's not the well known default
          if(config.server.port !== 443) {
            return config.server.domain + ':' + config.server.port;
          }
          return config.server.domain;
        });

        config.server.port.should.equal(8443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.host.should.equal('bedrock.dev:8443');
        c.set('server.port', 443);
        config.server.port.should.equal(443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.host.should.equal('bedrock.dev');
      });

      it('should support templates', function() {
        c.set('server.port', 8443);
        c.set('server.domain', 'bedrock.dev');
        cc('server.host', () => {
          // only add the port if it's not the well known default
          if(config.server.port !== 443) {
            return config.server.domain + ':' + config.server.port;
          }
          return config.server.domain;
        });
        cc('server.baseUri', 'https://${server.host}');

        config.server.port.should.equal(8443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.host.should.equal('bedrock.dev:8443');
        config.server.baseUri.should.equal('https://bedrock.dev:8443');

        // use locals option to simplify templates
        c.set({
          'base.a': 'a',
          'base.b': 'b',
          'base.c': 'c'
        });
        cc('base.computed1', '${base.a}:${base.b}:${base.c}');
        cc('base.computed2', '${a}:${b}:${c}', {locals: config.base});

        config.base.computed1.should.equal('a:b:c');
        config.base.computed2.should.equal('a:b:c');
      });

      it('should support multi', function() {
        c.set({
          'server.port': 8443,
          'server.domain': 'bedrock.dev',
          'server.name': 'Bedrock Dev',
          'users.admin.id': 1
        });
        cc({
          'server.url': 'https://${server.domain}:${server.port}',
          'users.admin.url': '${server.url}/users/${users.admin.id}'
        });

        config.server.port.should.equal(8443);
        config.server.domain.should.equal('bedrock.dev');
        config.server.name.should.equal('Bedrock Dev');
        config.users.admin.id.should.equal(1);
        config.server.url.should.equal('https://bedrock.dev:8443');
        config.users.admin.url.should.equal('https://bedrock.dev:8443/users/1');
      });

      it('should support arrays', function() {
        c.set('server.port', 8443);
        c.set('server.domain', 'bedrock.dev');
        cc('server.host', () => {
          // only add the port if it's not the well known default
          if(config.server.port !== 443) {
            return config.server.domain + ':' + config.server.port;
          }
          return config.server.domain;
        });
        cc('server.baseUri', 'https://${server.host}');
        c.setDefault('resources', []);
        cc('resources[0]', '${server.baseUri}/r/0');
        c.pushComputed('resources', '${server.baseUri}/r/1');
        config.resources.should.be.an('array');
        config.resources.length.should.equal(2);
        config.resources[0].should.equal('https://bedrock.dev:8443/r/0');
        config.resources[1].should.equal('https://bedrock.dev:8443/r/1');
      });
    });

    describe('examples', function() {
      it('should support an example', function() {
        const config = {};
        const options = {config, locals: config};
        const c = new bedrock.util.config.Config(config, options);
        const cc = c.computer();
        c.set('server.port', 8443);
        // direct access, 'server' container known to exist
        config.server.domain = 'bedrock.dev';
        cc('server.host', () => {
          if(config.server.port !== 443) {
            return config.server.domain + ':' + config.server.port;
          }
          return config.server.domain;
        });
        cc('server.baseUri', 'https://${server.host}');

        // use Config.setComputed API
        c.setComputed('server.baseUri1', 'https://${server.host}');
        // bind setComputed
        const cc2 = c.setComputed.bind(c);
        cc2('server.baseUri2', 'https://${server.host}');
        // use binding API
        const cc3 = c.computer();
        cc3('server.baseUri3', 'https://${server.host}');

        // all should have the same value
        config.server.baseUri1.should.equal('https://bedrock.dev:8443');
        config.server.baseUri2.should.equal('https://bedrock.dev:8443');
        config.server.baseUri3.should.equal('https://bedrock.dev:8443');

        // check custom https port
        config.server.baseUri.should.equal('https://bedrock.dev:8443');
        // update and check well known https port
        config.server.port = 443;
        config.server.baseUri.should.equal('https://bedrock.dev');
      });
    });
  });
});

// TODO: add test that adds logger early
// see: https://github.com/digitalbazaar/bedrock/issues/92

/*
const winston = require('winston');

bedrock.events.on('bedrock-cli.init', function() {
  // TODO: test w/custom logger that writes to string, not file
  // see: https://github.com/digitalbazaar/bedrock/issues/91
  bedrock.loggers.addTransport('test', new winston.transports.File({
    level: 'debug',
    silent: false,
    json: false,
    timestamp: true,
    filename: '/tmp/test.log'
  }));
});
*/
