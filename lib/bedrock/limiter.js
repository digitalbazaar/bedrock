/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
// TODO: just require('bedrock')
var bedrock = {
  config: require('../config'), // bedrock-config
  events: require('./events'), // bedrock-events
  loggers: require('./loggers') // bedrock-loggers
};
var redback = require('redback');

// the Redis-backed limiters
var limits = {};

// setup logger in init call
var logger;

// only initialize and attach if a limit is set
if(bedrock.config.limiter.ipRequestsPerHour > 0) {
  bedrock.events.on('bedrock.modules.init', init);

  // attach limiter before express body parser
  bedrock.events.on('bedrock-express.configure.bodyParser', function(app) {
    // rate limit based on IP address
    app.use(ipRateLimit);
  });
}

function init(callback) {
  // get Redis-client
  var rbclient = redback.createClient(
    bedrock.config.limiter.port,
    bedrock.config.limiter.host,
    bedrock.config.limiter.options);

  // use password if configured
  if(bedrock.config.limiter.password) {
    rbclient.client.auth(bedrock.config.limiter.password, function() {});
  }

  logger = bedrock.loggers.get('app');

  // log redis errors
  rbclient.client.on('error', function(err) {
    logger.error('Redis error:', err.toString());
  });

  rbclient.client.on('connect', function() {
    logger.info('Redis connected.');
  });

  // wait until ready and setup limiters
  rbclient.client.on('ready', function() {
    logger.info('Redis ready.');
    logger.info('Adding IP limiters, requests per hour: ' +
      bedrock.config.limiter.ipRequestsPerHour);

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
    logger.info('Redis disconnected.');
    logger.info('Removing IP limiters.');
    limits = {};
  });

  // TODO: add option to block startup (pass an error to callback) if
  // redis doesn't connect properly
  // continue regardless of whether redis starts properly or not
  callback();
}

/**
 * Limits HTTP requests based on the requesting IP address.
 *
 * @param req the HTTP request.
 * @param res the HTTP response.
 * @param next the next function in the chain.
 */
function ipRateLimit(req, res, next) {
  // check for no limit
  if(bedrock.config.limiter.ipRequestsPerHour <= 0) {
    return next();
  }

  // FIXME: limit based on route and route cost
  // FIXME: calculate route cost dynamically
  var ipLimit = limits['*'];

  if(!ipLimit) {
    logger.warn('No IP limiter configured.');
    return next();
  }

  // FIXME: add configure options
  req.pause();
  ipLimit.addCount(req.ip, 3600, function(err, count) {
    req.resume();

    if(err) {
      // log error
      logger.error('A Redis error occurred:', err.toString());

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
}
