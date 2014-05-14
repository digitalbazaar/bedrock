/*
 * Copyright (c) 2013-2014 Digital Bazaar, Inc. All rights reserved.
 */

'use strict';

var jsonld = require(__libdir + '/bedrock/jsonld');
var bedrock = {
  security: require(__libdir + '/bedrock/security', true)
};
var should = GLOBAL.should;

var privateKey = {
  privateKeyPem: '-----BEGIN RSA PRIVATE KEY-----\r\n' +
  'MIICWwIBAAKBgQC4R1AmYYyE47FMZgo708NhFU+t+VWn133PYGt/WYmD5BnKj679\r\n' +
  'YiUmyrC3hX6oZfo4eVpOkycxZvGgXCLQGuDp45XfZkdsjqs3o62En4YjlHWxgeGm\r\n' +
  'kiRqGfZ3sJ3u5WZ2xwapdZY3/2T/oOV5ri8SktTvmVGCyhwFuJC/NbJMEwIDAQAB\r\n' +
  'AoGAZXNdPMQXiFGSGm1S1P0QYzJIW48ZCP4p1TFP/RxeCK5bRJk1zWlq6qBMCb0E\r\n' +
  'rdD2oICupvN8cEYsYAxZXhhuGWZ60vggbqTTa+4LXB+SGCbKMX711ZoQHdY7rnaF\r\n' +
  'b/Udf4wTLD1yAslx1TrHkV56OfuJcEdWC7JWqyNXQoxedwECQQDZvcEmBT/Sol/S\r\n' +
  'AT5ZSsgXm6xCrEl4K26Vyw3M5UShRSlgk12gfqqSpdeP5Z7jdV/t5+vD89OJVfaa\r\n' +
  'Tw4h9BibAkEA2Khe03oYQzqP1V4YyV3QeC4yl5fCBr8HRyOMC4qHHKQqBp2VDUyu\r\n' +
  'RBJhTqqf1ErzUBkXseawNxtyuPmPrMSl6QJAQOgfu4W1EMT2a1OTkmqIWwE8yGMz\r\n' +
  'Q28u99gftQRjAO/s9az4K++WSUDGkU6RnpxOjEymKzNzy2ykpjsKq3RoIQJAA+XL\r\n' +
  'huxsYVE9Yy5FLeI1LORP3rBJOkvXeq0mCNMeKSK+6s2M7+dQP0NBYuPo6i3LAMbi\r\n' +
  'yT2IMAWbY76Bmi8TeQJAfdLJGwiDNIhTVYHxvDz79ANzgRAd1kPKPddJZ/w7Gfhm\r\n' +
  '8Mezti8HCizDxPb+H8HlJMSkfoHx1veWkdLaPWRFrA==\r\n' +
  '-----END RSA PRIVATE KEY-----'
};
var publicKey = {
  id: 'https://bedrock.dev/i/username/keys/1',
  publicKeyPem:
  '-----BEGIN PUBLIC KEY-----\r\n' +
  'MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQC4R1AmYYyE47FMZgo708NhFU+t\r\n' +
  '+VWn133PYGt/WYmD5BnKj679YiUmyrC3hX6oZfo4eVpOkycxZvGgXCLQGuDp45Xf\r\n' +
  'Zkdsjqs3o62En4YjlHWxgeGmkiRqGfZ3sJ3u5WZ2xwapdZY3/2T/oOV5ri8SktTv\r\n' +
  'mVGCyhwFuJC/NbJMEwIDAQAB\r\n' +
  '-----END PUBLIC KEY-----'
};

var testObject = {
  '@context': 'https://w3id.org/bedrock/v1',
  'http://example.com/foo': 'bar'
};

// See the NOTE in the tests if this must be regenerated.
var encryptedMessage = {"@context":"https://w3id.org/bedrock/v1","type":"EncryptedMessage","cipherData":"FHpoqgUXY/Vh6JjahGPEvQL8h3a1ujJu8QB2ZRe274ltOIQA3gEvDieYkmnB0JwRKkyS8qeQ5fHe3+tG7uhiUzx338VFHowKBl5t3c32biM=","cipherAlgorithm":"rsa-sha256-aes-128-cbc","cipherKey":"AdnKdDo0Fx7OMAW/mt8wyZDpaLVfzbN5LhO80csyaevtW8ugEvMMkHNswKIP6OtC0iB4UiZJ3Km3B+Hg25lKDZiCdV5/ZmHJTloCauXb7Ca7onMSqMQMEt0QAkcFY+o2QjD2QzvEebpVkzzBPZq7eFBLttZR1THr8YFUEIQphAw=","initializationVector":"XdicEPOpQ4WqPS6cm/UxLsjfXYKAC62gn9iaVr8Cw7KtDSW3uETaKePgBIEYLiTx21txNtrYL0Qw2XYZ0T1OAiFpng/3w3ZSjQ8pDnb3JSFX8qY1Mq4a3ZpAXFemwFc6LLwA8WHKGa06hzc7QEkozJhQgIyEj3O9Gf6EzsPxPXQ=","publicKey":"https://bedrock.dev/i/username/keys/1"};

var testPasswordHash = 'bcrypt:$2a$10$hjp3zswzxnOV9A1gui//COzuM/.AG4hArsQEiAIA1nUION1hQ5W12';

describe('bedrock.security', function() {
  describe('JSON-LD hashing', function() {
    it('should generate the correct hash', function(done) {
      bedrock.security.hashJsonLd(testObject, null, function(err, hash) {
        should.not.exist(err);
        hash.should.equal('urn:sha256:' +
        '63ca27944af9deea730890d72c1d0e8e3674436073e883c761fded6f621e77dd');
        done();
      });
    });
  });

  describe('JSON-LD signatures', function() {
    it('should be verifiable', function(done) {
      bedrock.security.signJsonLd(testObject, {
        key: privateKey,
        creator: publicKey.id
      }, function(err, signed) {
        should.not.exist(err);
        bedrock.security.verifyJsonLd(signed, publicKey,
          function(err, verified) {
            should.not.exist(err);
            verified.should.be.true;
            done();
          });
      });
    });
  });

  describe('JSON-LD decryption', function() {
    it('should retrieve the original message', function(done) {
      // If this fails and encryptedMessage must be regenerated see the
      // console.log NOTE below.
      bedrock.security.decryptJsonLd(
        encryptedMessage, privateKey, function(err, msg) {
          should.not.exist(err);
          jsonld.compact(
            msg, {'@context': 'https://w3id.org/bedrock/v1'},
            function(err, msg) {
              should.not.exist(err);
              msg.should.eql(testObject);
              done();
            });
      });
    });
  });

  describe('JSON-LD encryption-decryption roundtrip', function() {
    it('should result in the original message', function(done) {
      bedrock.security.encryptJsonLd(
        testObject, publicKey, function(err, msg) {
        should.not.exist(err);
        // NOTE: enable this to print out the hardcoded "encryptedMessage".
        //console.log(JSON.stringify(msg));
        bedrock.security.decryptJsonLd(msg, privateKey, function(err, msg) {
          should.not.exist(err);
          jsonld.compact(
            msg, {'@context': testObject['@context']},
            function(err, msg) {
              should.not.exist(err);
              msg.should.eql(testObject);
              done();
            });
        });
      });
    });
  });

  describe('JSON-LD password hashing', function() {
    it('should generate non-legacy, valid hashes', function(done) {
      bedrock.security.createPasswordHash('password', function(err, hash) {
        should.not.exist(err);
        bedrock.security.verifyPasswordHash(hash, 'password',
          function(err, verified, legacy) {
            should.not.exist(err);
            legacy.should.be.false;
            verified.should.be.true;
            done();
        });
      });
    });

    it('should validate non-legacy, valid hashes', function(done) {
      bedrock.security.verifyPasswordHash(
        testPasswordHash, 'password', function(err, verified, legacy) {
          should.not.exist(err);
          legacy.should.be.false;
          verified.should.be.true;
          done();
      });
    });
  });

  // FIXME: add test that revokes a key and signJsonLd fails with it
});
