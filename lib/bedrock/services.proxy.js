/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var forge = require('node-forge');
var fs = require('fs');
var httpProxy = require('http-proxy');
var httpSignature = require('http-signature');
var mkdirp = require('mkdirp');
var path = require('path');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools'),
  website: require('./website')
};

// constants
// TODO: change to 'bedrock.services'
var MODULE_NS = bedrock.website.namespace;

// module API
var api = {};
api.name = MODULE_NS + '.proxy';
api.namespace = MODULE_NS;
module.exports = api;

// module globals
var apiPublicKey = '';
var apiPublicKeyFingerprint = '';
var apiPrivateKey = '';

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  async.auto({
    getKeys: function(callback) {
      // see if the proxy should use HTTP Signatures for requests
      if(bedrock.config.proxy.hasOwnProperty('keys') &&
        bedrock.config.proxy.keys.hasOwnProperty('public') &&
        bedrock.config.proxy.keys.hasOwnProperty('private')) {

        readKeys(callback);
      } else {
        callback();
      }
    },
    addServices: ['getKeys', function(callback, results) {
      addServices(app, callback);
    }]
  }, callback);
};

/**
 * Reads a public/private keypair for the proxy to use by either reading the
 * files from disk, or generating the files.
 *
 * @param callback(err) called once the services have been added to the server.
 */
function readKeys(callback) {
  var publicKeyPath = bedrock.config.proxy.keys.public;
  var privateKeyPath = bedrock.config.proxy.keys.private;

  async.auto({
    checkKeys: function(callback) {
      // check to see if the key files exist
      fs.exists(publicKeyPath, function(publicFound) {
        fs.exists(privateKeyPath, function(privateFound) {
          callback(null, {
            publicExists: publicFound,
            privateExists: privateFound
          });
        });
      });
    },
    generateKeys: ['checkKeys', function(callback, results) {
      // only generate keys if ones don't already exist
      if(!results.checkKeys.publicExists) {
        mkdirp.mkdirp.sync(path.dirname(publicKeyPath));

        // generate the public/private keypair
        bedrock.logger.info(
          'Generating public/private keypairs for proxy service.');
        forge.pki.rsa.generateKeyPair({bits: 2048}, function(err, keypair) {
          if(err) {
            return callback(err);
          }

          // convert the keypairs to PEM format
          var publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
          var privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);

          // write the keypairs to disk
          fs.writeFile(publicKeyPath, publicKeyPem, function(err) {
            if(err) {
              return callback(err);
            }
            fs.writeFile(privateKeyPath, privateKeyPem, function(err) {
              if(err) {
                return callback(err);
              }
              callback();
            });
          });
        });
      } else {
        callback();
      }
    }],
    loadKeys: ['generateKeys', function(callback, results) {
      // read public/private keypairs from disk
      fs.readFile(publicKeyPath, {encoding: 'utf8'}, function(err, data) {
        if(err) {
          return callback(err);
        }
        apiPublicKey = data;

        // calculate the public key fingerprint
        var publicKey = forge.pki.publicKeyFromPem(apiPublicKey);
        var der =
          forge.asn1.toDer(forge.pki.publicKeyToRSAPublicKey(publicKey));
        var md = forge.md.sha1.create();
        md.update(der.getBytes());
        apiPublicKeyFingerprint = 'urn:rsa-key-der-fingerprint-sha1:' +
          md.digest().toHex();
        bedrock.logger.debug(
          'loaded crypto keys for proxy service: ' + apiPublicKeyFingerprint);

        fs.readFile(privateKeyPath, {encoding: 'utf8'}, function(err, data) {
          if(err) {
            return callback(err);
          }
          apiPrivateKey = data;
          callback();
        });

      });
    }]
  }, callback);
}

/**
 * Adds a set of forwarding headers for requests that are proxied.
 *
 * @param req the request to add the headers to.
 */
function addForwardHeaders(req) {
  req.setHeader('xfwd', 'localhost');
  req.setHeader('X-Is-HTTPS', 'on');
}

/**
 * Adds web services to the server.
 *
 * @param app the bedrock application.
 * @param callback(err) called once the services have been added to the server.
 */
function addServices(app, callback) {

  app.server.get('/proxy/key',
    bedrock.website.makeResourceHandler({
      get: function(req, res, callback) {
        callback(null, {
          publicKeyPem: apiPublicKey,
          publicKeyFingerprint: apiPublicKeyFingerprint
        });
      }
  }));

  var proxy = httpProxy.createProxyServer({});

  proxy.on('proxyReq', function(proxyReq, req, res, options) {
    addForwardHeaders(proxyReq);
    // if a private key exists, digitally sign the outgoing proxied message
    if(apiPrivateKey) {
      httpSignature.sign(proxyReq, {
        key: apiPrivateKey,
        keyId: apiPublicKeyFingerprint
      });
    }
  });

  // add all paths that should be proxied
  bedrock.config.proxy.paths.forEach(function(proxyConfig) {
    bedrock.logger.info('Adding proxy route ' + proxyConfig.route + ' to ' +
      proxyConfig.options.target);

    app.server.all(proxyConfig.route, function(req, res, next) {
      proxy.web(req, res, proxyConfig.options);
    });
  });

  callback(null);
}
