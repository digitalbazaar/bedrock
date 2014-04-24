/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bcrypt = require('bcrypt');
var crypto = require('crypto');
var ursa = require('ursa');
var jsonld = require('./jsonld'); // use locally-configured jsonld
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var BedrockError = bedrock.tools.BedrockError;

var api = {};
module.exports = api;

/**
 * Gets a hash on the given JSON-LD object. In order to hash a JSON-LD
 * object, it is first reframed (if a frame is provided) and then
 * normalized.
 *
 * @param obj the JSON-LD object to hash.
 * @param [frame] the frame to use to reframe the object (optional).
 * @param callback(err, hash) called once the operation completes.
 */
api.hashJsonLd = function(obj, frame, callback) {
  // handle args
  if(typeof frame === 'function') {
    callback = frame;
    frame = null;
  }

  async.waterfall([
    function(callback) {
      // if context is not present, it is safe to assume it uses
      // the default bedrock context
      if(!('@context' in obj)) {
        obj = bedrock.tools.clone(obj);
        obj['@context'] = bedrock.config.constants.CONTEXT_URL;
        return callback(null, obj);
      }
      callback(null, obj);
    },
    function(obj, callback) {
      // do reframing if frame supplied
      if(frame) {
        return jsonld.frame(obj, frame, callback);
      }
      callback(null, obj);
    },
    function(obj, callback) {
      // normalize
      jsonld.normalize(obj, {format: 'application/nquads'}, callback);
    },
    function(normalized, callback) {
      // hash
      var md = crypto.createHash('sha256');
      md.end(normalized, 'utf8');
      callback(null, 'urn:sha256:' + md.read().toString('hex'));
    }
  ], callback);
};

/**
 * Signs a JSON-LD object that is assumed to be compacted using the default
 * bedrock context. The signature will be stored under "signature" in the
 * output.
 *
 * @param obj the JSON-LD object to sign.
 * @param options the options to use:
 *   key the private key to sign with.
 *   creator the URL to the paired public key.
 *   [date] an optional date to override the signature date with.
 *   [domain] an optional domain to include in the signature.
 *   [nonce] an optional nonce to include in the signature.
 * @param callback(err, output) called once the operation completes.
 */
api.signJsonLd = function(obj, options, callback) {
  var key = options.key;
  var creator = options.creator;
  var date = null;
  var domain = null;
  var nonce = null;
  if('date' in options) {
    date = options.date;
  }
  if('domain' in options) {
    domain = options.domain;
  }
  if('nonce' in options) {
    nonce = options.nonce;
  }

  // check key
  if(!('privateKeyPem' in key)) {
    return callback(new BedrockError(
      'PrivateKey missing "privateKeyPem" property.',
      'bedrock.security.InvalidPrivateKey'));
  }

  if('revoked' in key) {
    return callback(new BedrockError(
      'The public key has been revoked.',
      'bedrock.security.RevokedPublicKey', {'public': true}));
  }

  // clone object
  var output = bedrock.tools.clone(obj);

  async.waterfall([
    function(callback) {
      // get data to be signed
      _getSignatureData(output, callback);
    },
    function(data, callback) {
      // get created date
      var created = bedrock.tools.w3cDate(date);

      // create signature
      var signer = crypto.createSign('RSA-SHA256');
      signer.on('finish', function() {
        var signature;
        try {
          signature = signer.sign(key.privateKeyPem, 'base64');
        } catch(e) {
          return signer.emit('error', e);
        }

        // set signature info
        var signInfo = {
          type: 'GraphSignature2012',
          creator: creator,
          created: created,
          signatureValue: signature
        };
        if(nonce !== undefined && nonce !== null) {
          signInfo.nonce = nonce;
        }
        if(domain !== undefined && domain !== null) {
          signInfo.domain = domain;
        }

        // attach new signature info
        // FIXME: support multiple signatures
        output.signature = signInfo;
        callback(null, output);
      }).on('error', function(err) {
        callback(new BedrockError(
          'Could not sign JSON-LD.',
          'bedrock.security.SignError', null, err));
      });

      if(nonce !== undefined && nonce !== null) {
        signer.write(nonce, 'utf8');
      }
      signer.write(created, 'utf8');
      signer.write(data, 'utf8');
      if(domain !== undefined && domain !== null) {
        signer.write('@' + domain, 'utf8');
      }
      signer.end();
    }
  ], callback);
};

/**
 * Verifies a JSON-LD object.
 *
 * @param obj the JSON-LD object to verify the signature on.
 * @param key the public key to verify with.
 * @param callback(err, verified) called once the operation completes.
 */
api.verifyJsonLd = function(obj, key, callback) {
  // FIXME: support multiple signatures
  if(!('signature' in obj)) {
    return callback(new BedrockError(
      'Could not verify signature on object. Object is not signed.',
      'bedrock.security.InvalidSignature'));
  }

  if('revoked' in key) {
    return callback(new BedrockError(
      'The public key has been revoked.',
      'bedrock.security.RevokedPublicKey', {'public': true}));
  }

  if(!('publicKeyPem' in key)) {
    return callback(new BedrockError(
      'The public key is missing the "publicKeyPem" property.',
      'bedrock.security.InvalidPublicKey'));
  }

  // get data to be verified
  _getSignatureData(obj, function(err, data) {
    if(err) {
      return callback(new BedrockError(
        'Could not verify JSON-LD.',
        'bedrock.security.VerifyError', null, err));
    }

    // verify signature
    var signInfo = obj.signature;
    var verifier = crypto.createVerify('RSA-SHA256');
    verifier.on('finish', function() {
      var verified = verifier.verify(
        key.publicKeyPem, signInfo.signatureValue, 'base64');
      callback(null, verified);
    }).on('error', function(err) {
      return callback(new BedrockError(
        'Could not verify JSON-LD.',
        'bedrock.security.VerifyError', null, err));
    });
    if('nonce' in signInfo) {
      verifier.write(signInfo.nonce, 'utf8');
    }
    verifier.write(signInfo.created, 'utf8');
    verifier.write(data, 'utf8');
    if('domain' in signInfo) {
      verifier.write('@' + signInfo.domain, 'utf8');
    }
    verifier.end();
  });
};

/**
 * Encrypts a JSON-LD object using a combination of public key and
 * symmetric key encryption. This method assumes the object has been
 * appropriate compacted using the bedrock context.
 *
 * @param obj the JSON-LD object to encrypt.
 * @param publicKey the public key to encrypt with.
 * @param callback(err, msg) called once the operation completes.
 */
api.encryptJsonLd = function(obj, publicKey, callback) {
  async.waterfall([
    function(callback) {
      // generate key and IV
      crypto.randomBytes(32, function(err, buf) {
        if(err) {
          return callback(err);
        }
        var key = buf.slice(0, 16);
        var iv = buf.slice(16);
        callback(null, key, iv);
      });
    },
    function(key, iv, callback) {
      // use @context url, symmetric encrypt data
      var oldCtx = obj['@context'] || null;
      obj['@context'] = bedrock.config.constants.CONTEXT_URL;
      var cipher = crypto.createCipheriv('aes-128-cbc', key, iv);
      cipher.write(JSON.stringify(obj), 'utf8');
      cipher.on('finish', function() {
        // restore old context
        if(oldCtx !== null) {
          obj['@context'] = oldCtx;
        }

        // get encrypted data
        var encrypted = cipher.read().toString('base64');

        try {
          // public key encrypt key and IV
          var pk = ursa.createPublicKey(publicKey.publicKeyPem, 'utf8');
          key = pk.encrypt(key, null, 'base64', ursa.RSA_PKCS1_OAEP_PADDING);
          iv = pk.encrypt(iv, null, 'base64', ursa.RSA_PKCS1_OAEP_PADDING);
        } catch(e) {
          return cipher.emit('error', e);
        }

        // create encrypted message
        var msg = {
          '@context': bedrock.config.constants.CONTEXT_URL,
          type: 'EncryptedMessage',
          cipherData: encrypted,
          cipherAlgorithm: 'rsa-sha256-aes-128-cbc',
          cipherKey: key,
          initializationVector: iv,
          publicKey: publicKey.id
        };

        callback(null, msg);
      }).on('error', function(err) {
        // restore old context
        if(oldCtx !== null) {
          obj['@context'] = oldCtx;
        }
        callback(new BedrockError(
          'Could not encrypt message.',
          'bedrock.security.EncryptionError', {public: true}, err));
      }).end();
    }
  ], callback);
};

/**
 * Decrypts a JSON-LD object using a combination of private key and
 * symmetric key decryption.
 *
 * @param obj the JSON-LD object to decrypt.
 * @param privateKey the private key to decrypt with.
 * @param callback(err, msg) called once the operation completes.
 */
api.decryptJsonLd = function(obj, privateKey, callback) {
  // check algorithm
  if(obj.cipherAlgorithm !== 'rsa-sha256-aes-128-cbc') {
    return callback(new BedrockError(
      'The JSON-LD encrypted message algorithm is not supported.',
      'bedrock.security.UnsupportedAlgorithm',
      {'public': true, algorithm: obj.cipherAlgorithm, httpStatusCode: 400}));
  }

  var decipher;
  try {
    // private key decrypt key and IV
    var pk = ursa.createPrivateKey(privateKey.privateKeyPem, 'utf8');
    var key = pk.decrypt(
      obj.cipherKey, 'base64', undefined, ursa.RSA_PKCS1_OAEP_PADDING);
    var iv = pk.decrypt(
      obj.initializationVector, 'base64', undefined,
      ursa.RSA_PKCS1_OAEP_PADDING);

    // symmetric decrypt data
    decipher = crypto.createDecipheriv('aes-128-cbc', key, iv);
  } catch(e) {
    return callback(new BedrockError(
      'Could not decrypt message.',
      'bedrock.security.DecryptionError', {public: true}, e));
  }

  // do message decryption
  decipher.write(obj.cipherData, 'base64');
  decipher.on('finish', function() {
    var decrypted = decipher.read().toString('utf8');
    var msg;
    try {
      msg = JSON.parse(decrypted);
    } catch(e) {
      return decipher.emit('error', e);
    }
    callback(null, msg);
  }).on('error', function(err) {
    callback(new BedrockError(
      'Could not decrypt message.',
      'bedrock.security.DecryptionError', {public: true}, err));
  }).end();
};

/**
 * Creates a password hash that can be stored and later used to verify a
 * password at a later point in time.
 *
 * @param password the password to hash.
 * @param callback(err, hash) called once the operation completes.
 */
api.createPasswordHash = function(password, callback) {
  bcrypt.genSalt(function(err, salt) {
    if(err) {
      return callback(err);
    }
    bcrypt.hash(password, salt, function(err, hash) {
      callback(err, 'bcrypt:' + hash);
    });
  });
};

/**
 * Verifies a password against a previously generated password hash. The
 * hash value should have been generated via createPasswordHash() or by
 * a supported legacy method.
 *
 * @param hash the hash value to verify against.
 * @param password the password to verify.
 * @param callback(err, verified, legacy) called once the operation completes.
 */
api.verifyPasswordHash = function(hash, password, callback) {
  var fields = hash.split(':');
  if(fields.length !== 2 && fields.length !== 3) {
    return callback(new BedrockError(
      'Could not verify password hash. Invalid input.',
      'bedrock.security.MalformedPasswordHash'));
  }

  // bcrypt hash
  if(fields[0] === 'bcrypt') {
    return bcrypt.compare(password, fields[1], function(err, verified) {
      callback(err, verified, false);
    });
  }
  // unknown algorithm
  callback(new BedrockError(
    'Could not verify password hash. Invalid input.',
    'bedrock.security.MalformedPasswordHash'));
};

/**
 * Gets the data used to generate or verify a signature. It is assumed that
 * the given object is compacted using the default JSON-LD context.
 *
 * @param obj the object to get the data for.
 * @param callback(err, data) called once the operation completes.
 */
function _getSignatureData(obj, callback) {
  // safe to assume default bedrock context
  var oldCtx = obj['@context'] || null;
  obj['@context'] = bedrock.config.constants.CONTEXT_URL;
  var oldSignature = obj.signature || null;
  delete obj.signature;

  // use object id as base, if given
  var options = {format: 'application/nquads'};
  if('id' in obj) {
    options.base = obj.id;
  }
  // normalize
  jsonld.normalize(obj, options, function(err, normalized) {
    if(oldCtx !== null) {
      obj['@context'] = oldCtx;
    }
    if(oldSignature !== null) {
      obj.signature = oldSignature;
    }
    callback(err, normalized);
  });
}
