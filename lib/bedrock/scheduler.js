/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var async = require('async');
var bedrock = {
  config: require('../config'),
  db: require('./database'),
  events: require('./events'),
  logger: require('./loggers').get('app'),
  tools: require('./tools')
};
var crypto = require('crypto');
var iso8601 = require('../iso8601/iso8601');
var BedrockError = bedrock.tools.BedrockError;

// constants
var MODULE_NS = 'bedrock.scheduler';

var EVENT_SCAN = 'bedrock.Job.scan';

// module API
var api = {};
api.name = MODULE_NS;
module.exports = api;

// distributed ID generator
var jobIdGenerator = null;

// defined job types
var jobTypes = {};

// TODO: abstract into standalone npm module?

/**
 * Initializes this module.
 *
 * @param app the application to initialize this module for.
 * @param callback(err) called once the operation completes.
 */
api.init = function(app, callback) {
  // do initialization work
  async.waterfall([
    function(callback) {
      // open all necessary collections
      bedrock.db.openCollections(['job'], callback);
    },
    function(callback) {
      // setup collections (create indexes, etc)
      bedrock.db.createIndexes([{
        collection: 'job',
        fields: {id: 1},
        options: {unique: true, background: false}
      }, {
        collection: 'job',
        fields: {type: 1, id: 1},
        options: {unique: true, background: false}
      }, {
        // TODO: is this index the most optimal for job searches?
        collection: 'job',
        fields: {
          due: 1,
          'job.priority': 1,
          type: 1,
          permits: 1,
          workers: 1,
          id: 1
        },
        options: {unique: true, background: false}
      }], callback);
    },
    function(callback) {
      bedrock.db.getDistributedIdGenerator('job',
        function(err, idGenerator) {
          if(!err) {
            jobIdGenerator = idGenerator;
          }
          callback(err);
      });
    },
    function(callback) {
      // create jobs, ignoring duplicate errors
      async.forEachSeries(
        bedrock.config.scheduler.jobs,
        function(i, callback) {
          api.schedule(i, function(err) {
            if(err && bedrock.db.isDuplicateError(err)) {
              err = null;
            }
            callback(err);
          });
        },
        callback);
    },
    function(callback) {
      // add listener for scan events
      bedrock.events.on(EVENT_SCAN, function(event) {
        bedrock.logger.debug('got job scan event', event);
        var options = {};
        if(event && event.details) {
          if(event.details.jobId) {
            options.id = event.details.jobId;
          } else {
            options.reschedule = bedrock.config.scheduler.idleTime;
          }
          process.nextTick(function() {_runWorker(options);});
        }
      });

      // run up to 'concurrency' concurrent jobs
      for(var i = 0; i < bedrock.config.scheduler.concurrency; ++i) {
        bedrock.events.emitAsync({type: EVENT_SCAN, details: {}});
      }
      callback();
    }
  ], callback);
};

/**
 * Defines a new job type. Schedules jobs will only be processed if their
 * types have been defined. A job type specifies:
 *
 * 1. the function that will be run to process a job of that type,
 * 2. how many workers can run a job of that type at the same time,
 * 3. how long a particular worker that is running a job of that type
 *   may run before being considered expired, freeing another worker to
 *   take its place and restart the job.
 *
 * Note that, due to current implementation limitations, lock duration can
 * only be configured on a per-job-type basis, it cannot be configured
 * per-job.
 *
 * @param type the unique type of job.
 * @param options the options to use:
 *          [lockDuration] how long a job of this type will execute in
 *            isolation before another worker may reattempt it; note that
 *            if a job is scheduled to repeat, the lock duration should always
 *            be less than the schedule or else the job may not be processed
 *            on time.
 *          [defaults] default job values to use.
 *            [schedule] how often to run the job.
 *            [priority] a number indicating priority, 0 for default, negative
 *              for low, positive for high.
 *            [concurrency] the number of workers that can concurrently work on
 *              a job, -1 for unlimited.
 * @param fn(job, callback) the function to call to execute the job.
 */
api.define = function(type, options, fn) {
  bedrock.logger.info('defining job type', type);
  if(typeof options === 'function') {
    fn = options;
    options = {};
  }
  jobTypes[type] = bedrock.tools.extend(true, {
    lockDuration: bedrock.config.scheduler.lockDuration,
    defaults: bedrock.config.scheduler.defaults,
    fn: fn
  }, options || {});
};

/**
 * Creates a new job ID.
 *
 * @param callback(err, id) called once the operation completes.
 */
api.generateJobId = function(callback) {
  jobIdGenerator.generateId(function(err, id) {
    if(err) {
      return callback(err);
    }
    callback(null, id);
  });
};

/**
 * Schedules a new job. The job must have a type set. It may specify
 * a unique id, if it does not, one will be generated. It may also specify
 * how often to run the job and any job-specific data. Jobs may be scheduled
 * that do not have defined types, however, they will never be executed by this
 * particular scheduler (other schedulers may execute them).
 *
 * @param job the job to schedule.
 * @param options the options to use.
 *          [immediate] true to run the job immediately if its schedule permits.
 * @param callback(err, record) called once the operation completes.
 */
api.schedule = function(job, options, callback) {
  if(!job.type) {
    return callback(new BedrockError(
      'Could not schedule job; no job type was specified.',
      MODULE_NS + '.InvalidJob'));
  }
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }
  options = options || {};

  async.waterfall([
    function(callback) {
      if(!job.id) {
        return api.generateJobId(callback);
      }
      callback(null, job.id);
    },
    function(id, callback) {
      job.id = id;

      bedrock.logger.info('scheduling job', job);

      // include any defaults
      var defaults = bedrock.config.scheduler.defaults;
      if(job.type in jobTypes) {
        defaults = bedrock.tools.extend(
          true, {}, defaults, jobTypes[job.type].defaults);
      }
      job = bedrock.tools.extend(true, {}, defaults, job);

      // insert the job
      var now = Date.now();
      var due = _getNextJobSchedule(job);
      var record = {
        id: bedrock.db.hash(job.id),
        meta: {
          created: now,
          updated: now
        },
        job: job,
        due: due,
        completed: null,
        permits: job.concurrency,
        workers: []
      };
      bedrock.db.collections.job.insert(
        record, bedrock.db.writeOptions, function(err, records) {
          if(err) {
            return callback(err);
          }
          if(options.immediate && due <= now) {
            // fire off worker
            _runWorker({id: job.id, type: job.type});
          }
          callback(null, records[0]);
        });
    }
  ], callback);
};

/**
 * Unschedules a job or all jobs of a certain type.
 *
 * @param options the options to use.
 *          [id] the id of the job to unschedule.
 *          [type] the type of jobs to unschedule.
 * @param callback(err) called once the operation completes.
 */
api.unschedule = function(options, callback) {
  if(!(options.id || options.type)) {
    return callback(new BedrockError(
      'Could not remove job(s); no job id and/or type was specified.',
      MODULE_NS + '.InvalidArguments'));
  }
  var query = {};
  if(options.id) {
    query.id = bedrock.db.hash(options.id);
  }
  if(options.type) {
    query['job.type'] = options.type;
  }
  bedrock.db.collections.job.remove(query, bedrock.db.writeOptions, callback);
};

/**
 * Gets a job by its id.
 *
 * @param id the id of the job to retrieve.
 * @param callback(err, job, meta) called once the operation completes.
 */
api.getJob = function(actor, id, callback) {
  async.waterfall([
    function(callback) {
      bedrock.db.collections.job.findOne(
        {id: bedrock.db.hash(id)}, {}, callback);
    },
    function(record, callback) {
      if(!record) {
        return callback(new BedrockError(
          'Job not found.', MODULE_NS + '.JobNotFound', {id: id}));
      }
      callback(null, record.job, record.meta);
    }
  ], callback);
};

/**
 * Creates a worker ID. A worker ID is 40 hex digits long, consisting of a
 * start time (16 hex digits) concatenated with 24 random digits.
 *
 * @return the worker ID.
 */
api.createWorkerId = function() {
  // generate worker ID (16 hex start time + 24 hex random)
  var st = Date.now().toString(16);
  while(st.length < 16) {
    st = '0' + st;
  }
  var md = crypto.createHash('sha1');
  md.update(bedrock.tools.uuid());
  return st + md.digest('hex').substr(0, 24);
};

/**
 * Encodes an expired date as a worker ID (16 hex digit time + 24 zeros).
 *
 * @param expired the expired date (as ms since epoch) to encode.
 *
 * @return the 'expired' worker ID.
 */
api.encodeExpiredDate = function(expired) {
  expired = expired.toString(16);
  while(expired.length < 16) {
    expired = '0' + expired;
  }
  return expired + '000000000000000000000000';
};

/**
 * Gets the next time to run a job and updates the job schedule as appropriate.
 *
 * @param job the job.
 * @param [options] the options to use:
 *          [update] true to update the job schedule (assumes one job has
 *            completed).
 *
 * @return the next time to run the job.
 */
function _getNextJobSchedule(job, options) {
  options = options || {};

  if(!job.schedule) {
    job.schedule = bedrock.tools.w3cDate();
  }

  var interval = job.schedule.split('/');
  if(interval.length === 1) {
    // do not schedule job again
    if(options.update) {
      return null;
    }
    // one-time scheduling
    return new Date(job.schedule);
  }

  var start;
  var duration;
  if(interval.length === 2) {
    // R[n]/duration
    start = Date.now();
    duration = interval[1];
  } else {
    // R[n]/startDate/duration
    // always use 'now' as start date if updating to a new schedule
    // to prevent rescheduling in the past which will just cause an
    // infinite loop until the job schedule catches up
    start = options.update ? Date.now() : new Date(interval[1]).getTime();
    duration = interval[2];
  }
  var durationMs = iso8601.Period.parseToTotalSeconds(duration) * 1000;

  var repeats = -1;
  if(interval[0].length > 1) {
    // get specific number of repeats
    repeats = parseInt(interval[0].substr(1), 10) || 0;
  }

  // next due date for job
  var due;
  if(options.update) {
    due = new Date(start + durationMs);
    // rewrite schedule
    if(repeats === 1) {
      // only one repeat (which just occurred) so do final scheduling
      job.schedule = bedrock.tools.w3cDate(due);
    } else {
      job.schedule = 'R';
      if(repeats !== -1) {
        job.schedule += repeats;
      }
      job.schedule += ['', bedrock.tools.w3cDate(due), duration].join('/');
    }
  } else {
    due = new Date(start);
  }

  return due;
}

/**
 * Runs a worker execute scheduled jobs.
 *
 * @param options the options to use:
 *          id an optional job ID to specifically work on.
 * @param callback(err) called once the operation completes.
 */
function _runWorker(options, callback) {
  callback = callback || function() {};

  // get new worker ID and time
  var workerId = api.createWorkerId();
  var now = new Date();

  bedrock.logger.debug(
    'running job worker (' + workerId + ') to execute scheduled job' +
    (options.id ? (' "' + options.id + '"') : 's') + '...');

  // single update and new record retrieval db write options
  var singleUpdate = bedrock.tools.extend(
    {}, bedrock.db.writeOptions, {upsert: false, multi: false});

  // run algorithm on all matching entries
  var done = false;
  async.until(function() {return done;}, function(loopCallback) {
    /* Note: A worker will continue to run as long as it can mark a job to
    be executed. The query it will use will be for a specific job (if an ID is
    given) or for any job that meets the following criteria: it is due to be
    scheduled, it has a supported job type, it has a permit or an expired
    worker ID, and it has maximum priority of other jobs that meet the same
    criteria. */

    // implementation uses two queries: first looks for a job with an
    // available permit, if not found, second looks for a job with an
    // expired worker

    // build query to mark jobs that are scheduled to run now
    var baseQuery = {due: {$lte: now}};

    // mark job with max priority
    var queryOptions = {sort: {'job.priority': 1}};

    // mark specific job
    if(options.id) {
      baseQuery.id = bedrock.db.hash(options.id);
    }

    async.auto({
      getIdleJob: function(callback) {
        // if no supported job types, skip
        if(Object.keys(jobTypes).length === 0) {
          return callback(null, 0);
        }
        // only mark jobs with supported types and an available permit
        var query = bedrock.tools.extend({}, baseQuery, {
          'job.type': {$in: Object.keys(jobTypes)},
          permits: {$ne: 0},
          workers: {$ne: workerId}
        });
        bedrock.db.collections.job.findOne(query, {}, queryOptions, callback);
      },
      getExpiredJob: ['getIdleJob', function(callback, results) {
        // idle job or no supported job types
        if(results.getIdleJob || Object.keys(jobTypes).length === 0) {
          return callback(null, null);
        }
        // build supported job type + lock duration options
        var query = bedrock.tools.extend({}, baseQuery, {permits: 0, $or: []});
        for(var type in jobTypes) {
          // lock duration is used to indicate when to override a worker
          var expired = now.getTime() - jobTypes[type].lockDuration;
          expired = api.encodeExpiredDate(expired);
          query.$or.push(
            {'job.type': type, workers: {$lte: expired, $ne: workerId}});
        }
        bedrock.db.collections.job.findOne(query, {}, queryOptions, callback);
      }],
      markJob: ['getExpiredJob', function(callback, results) {
        // if no job was found, skip update
        if(!results.getIdleJob && !results.getExpiredJob) {
          if(options.id) {
            // error when job isn't found and a specific ID was given
            return callback(new BedrockError(
              'Job not found, has undefined type, or is already in progress.',
              MODULE_NS + '.JobNotFound', {id: options.id}));
          }
          // done, no matching jobs remain
          done = true;
          return loopCallback();
        }

        // prepare update
        var record = results.getIdleJob || results.getExpiredJob;
        var update = {$set: {'meta.updated': Date.now()}};

        // TODO: would be nice to do a pull here that also affects the
        // number of permits ... or, if the number of permits is -1,
        // do the pull without having to deal with permits or handling
        // worker IDs in memory (as this may not scale) ... there are
        // limitations with current mongo w/doing a pull and a push in
        // the same update

        // prune any expired workers, update permits, add new worker ID
        var expired = now.getTime() - jobTypes[record.job.type].lockDuration;
        expired = api.encodeExpiredDate(expired);
        update.$set.workers = record.workers.filter(function(worker) {
          return worker > expired;
        });
        update.$set.workers.push(workerId);
        // if permits not unlimited, update count
        if(record.permits >= 0) {
          update.$set.permits = (record.permits +
            record.workers.length - update.$set.workers.length);
        }
        bedrock.db.collections.job.update({
          id: record.id,
          permits: record.permits,
          workers: record.workers
        }, update, singleUpdate, function(err, n) {
          callback(err, n);
        });
      }],
      runJob: ['markJob', function(callback, results) {
        // if update failed it was likely because another worker grabbed the
        // job; loop and try another job
        if(!results.markJob) {
          return loopCallback();
        }
        var record = results.getIdleJob || results.getExpiredJob;
        var job = record.job;
        job.worker = {id: workerId};
        bedrock.logger.debug(
          'job worker (' + workerId + ') executing "' + job.type +
          '"' + ' job "' + job.id + '"...');

        try {
          jobTypes[job.type].fn(job, function(err) {
            callback(null, err || null);
          });
        } catch(ex) {
          callback(null, ex);
        }
      }],
      checkResult: ['runJob', function(callback, results) {
        var record = results.getIdleJob || results.getExpiredJob;
        var job = record.job;
        var error = results.runJob;
        var logFn = error ? bedrock.logger.error : bedrock.logger.debug;
        logFn(
          'job worker (' + workerId + ') completed "' + job.type +
          '"' + ' job "' + job.id + '"' +
          (error ? ' with error' : ''), error || undefined);

        // calculate next time to run job
        var due = _getNextJobSchedule(job, {update: true});

        // remove job, not to be rescheduled
        if(due === null) {
          return bedrock.db.collections.job.remove(
            {id: bedrock.db.hash(job.id), 'job.type': job.type},
            bedrock.db.writeOptions, function(err) {
              callback(err, due);
            });
        }

        // update job with new schedule if old due date is less than or
        // equal to new due date
        bedrock.db.collections.job.update({
          id: bedrock.db.hash(job.id),
          'job.type': job.type,
          due: {$lte: due}
        }, {
          $set: {
            'meta.updated': Date.now(),
            'job.schedule': job.schedule,
            due: due,
            completed: Date.now()
          }
        }, singleUpdate, function(err) {
          callback(err, due);
        });
      }],
      cleanup: ['checkResult', function(callback, results) {
        // skip cleanup if job was removed (checkResult === null)
        if(results.checkResult === null) {
          return callback();
        }
        var record = results.getIdleJob || results.getExpiredJob;
        var job = record.job;

        // remove worker if it hasn't expired
        var update = {
          $set: {'meta.updated': Date.now()},
          $pull: {workers: workerId}
        };
        // if permits not unlimited, increment
        if(record.permits >= 0) {
          update.$inc = {permits: 1};
        }
        bedrock.db.collections.job.update({
          id: bedrock.db.hash(job.id),
          'job.type': job.type,
          workers: workerId
        }, update, singleUpdate, function(err) {
          callback(err);
        });
      }]
    }, function(err) {
      // prevent stack overflow
      process.nextTick(function() {
        loopCallback(err);
      });
    });
  }, function(err) {
    if(err) {
      bedrock.logger.error(
        'error while scanning for scheduled jobs', {error: err});
    }
    bedrock.logger.debug('job worker (' + workerId + ') finished.');

    if(options.reschedule) {
      // reschedule worker if requested
      bedrock.logger.debug(
        'rescheduling job worker in ' + options.reschedule + ' ms');
      setTimeout(function() {
        var event = {type: EVENT_SCAN, details: {}};
        bedrock.events.emitAsync(event);
      }, options.reschedule);
    }
    if(callback) {
      callback(err);
    }
  });
}
