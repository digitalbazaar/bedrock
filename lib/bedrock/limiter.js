/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var redback = require('redback');
var bedrock = {
  config: require('../config'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};

var api = {};
module.exports = api;
api.name = 'limiter';

// the Redis-backed limiters
var limits = {};

api.init = function(app, callback) {
  // NOTE: app is not setup yet, use with care.

  // get Redis-client
  var rbclient = redback.createClient(
    bedrock.config.limiter.port,
    bedrock.config.limiter.host,
    bedrock.config.limiter.options);

  // use password if configured
  if(bedrock.config.limiter.password) {
    rbclient.client.auth(bedrock.config.limiter.password, function() {});
  }

  // log redis errors
  rbclient.client.on('error', function(err) {
    bedrock.logger.error('Redis error:', err.toString());
  });

  rbclient.client.on('connect', function(err) {
    // FIXME: Loggers aren't initialized at this point
    //bedrock.logger.info('Redis connected.');
  });

  // wait until ready and setup limiters
  rbclient.client.on('ready', function() {
    // FIXME: Loggers aren't initialized at this point
    //bedrock.logger.info('Redis ready.');
    //bedrock.logger.info('Adding IP limiters.');

    // create limits:
    // 60 second sample chunk per bucket, each bucket times out after an hour
    var ipLimit = rbclient.createRateLimit('requests-by-ip', {
      // FIXME: add configure options
      bucket_interval: 60,
      bucket_span: 3600,
      subject_expiry: 3600
    });
    limits['*'] = ipLimit;
  });

  // clean up when connection closed
  rbclient.client.on('end', function() {
    bedrock.logger.info('Redis disconnected.');
    bedrock.logger.info('Removing IP limiters.');
    limits = {};
  });
};

/**
 * Limits HTTP requests based on the requesting IP address.
 *
 * @param req the HTTP request.
 * @param res the HTTP response.
 * @param next the next function in the chain.
 */
api.ipRateLimit = function(req, res, next) {
  // check for no limit
  if(bedrock.config.limiter.ipRequestsPerHour <= 0) {
    return next();
  }

  // FIXME: limit based on route and route cost
  // FIXME: calculate route cost dynamically
  var ipLimit = limits['*'];

  if(!ipLimit) {
    bedrock.logger.warn('No IP limiter configured.');
    return next();
  }

  // FIXME: add configure options
  req.pause();
  ipLimit.addCount(req.ip, 3600, function(err, count) {
    req.resume();

    if(err) {
      // log error
      bedrock.logger.error('A Redis error occurred:', err.toString());

      // permit request
      return next();
    }

    // not rate limited
    if(count <= bedrock.config.limiter.ipRequestsPerHour) {
      return next();
    }

    // rate limited
    // FIXME: set the Retry-After HTTP Header
    //res.set('Retry-After', '...');
    res.send(
      429, 'Request denied. Too many HTTP requests from your IP address.');
  });
};
