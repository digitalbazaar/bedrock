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
        fields: {type: 1, id: 1},
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
          if(event.details.jobId && event.details.jobType) {
            options.id = event.details.jobId;
            options.type = event.details.jobType;
          }
          else {
            options.reschedule = bedrock.config.scheduler.idleTime;
          }
          process.nextTick(function() {_runWorker(options);});
        }
      });

      // run up to 'concurrency' concurrent jobs
      for(var i = 0; i < bedrock.config.scheduler.concurrency; ++i) {
        // run worker
        bedrock.events.emit({
          type: EVENT_SCAN,
          details: {}
        });
      }
      callback();
    }
  ], callback);
};

/**
 * Defines a new job type. Schedules jobs will only be processed if their
 * types have been defined.
 *
 * @param type the unique type of job.
 * @param [defaults] default job values to use.
 *          [schedule] how often to run the job.
 *          [lockDuration] how long a job will execute in isolation before
 *            another worker may reattempt it.
 *          [priority] a number indicating priority, 0 for default, negative
 *            for low, positive for high.
 * @param fn(callback) the function to call to execute the job.
 */
api.define = function(type, defaults, fn) {
  bedrock.logger.info('defining job type', type);
  if(typeof defaults === 'function') {
    fn = defaults;
    defaults = {};
  }
  jobTypes[type] = {
    defaults: defaults || {},
    fn: fn
  };
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
 * @param callback(err, record) called once the operation completes.
 */
api.schedule = function(job, callback) {
  if(!job.type) {
    return callback(new BedrockError(
      'Could not schedule job; no job type was specified.',
      MODULE_NS + '.InvalidJob'));
  }

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
          {}, defaults, jobTypes[job.type].defaults);
      }
      job = bedrock.tools.extend({}, defaults, job);

      // insert the job
      var now = Date.now();
      var record = {
        id: bedrock.db.hash(job.id),
        meta: {
          created: now,
          updated: now
        },
        job: job,
        due: _getNextJobSchedule(job),
        completed: null,
        // zero indicates no worker/expired worker
        worker: '0'
      };
      bedrock.db.collections.job.insert(
        record, bedrock.db.writeOptions, function(err, records) {
          if(err) {
            return callback(err);
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
 * Creates a worker ID. A worker ID is 40 hex digits long, consisting of a
 * start time (16 hex digits) concatenated with 24 random digits.
 *
 * @return the worker ID.
 */
function _createWorkerId() {
  // generate worker ID (16 hex start time + 24 hex random)
  var st = Date.now().toString(16);
  while(st.length < 16) {
    st = '0' + st;
  }
  var md = crypto.createHash('sha1');
  md.update(bedrock.tools.uuid());
  return st + md.digest('hex').substr(0, 24);
}

/**
 * Gets the next time to run a job and updates the job schedule as appropriate.
 *
 * @param job the job.
 * @param [options] the options to use:
 *          [update] true to update the job schedule (assumes one job has
 *            completed)
 *
 * @return the next time to run the job.
 */
function _getNextJobSchedule(job, options) {
  options = options || {};

  var interval = job.schedule.split('/');
  if(interval.length !== 3) {
    // do not schedule job again
    if(options.update) {
      return null;
    }
    // one-time scheduling
    return new Date(job.schedule);
  }

  // R[n]/startDate/duration
  var start = new Date(interval[1]).getTime();
  var duration = iso8601.Period.parseToTotalSeconds(interval[2]) * 1000;

  var repeats = -1;
  if(interval[0].length > 1) {
    // get specific number of repeats
    repeats = parseInt(interval[0].substr(1), 10) || 0;
  }

  // next due date for job
  var due;
  if(options.update) {
    due = new Date(start + duration);
    // rewrite schedule
    if(repeats !== -1) {
      job.schedule = 'R';
      job.schedule += repeats;
      job.schedule += ['', bedrock.tools.w3cDate(), interval[2]].join('/');
    }
    else {
      job.schedule = bedrock.tools.w3cDate(due);
    }
  }
  else {
    due = new Date(start);
  }

  return due;
}

/**
 * Runs a worker execute scheduled jobs.
 *
 * @param options the options to use:
 *          id: an optional job ID to specifically work on.
 * @param callback(err) called once the operation completes.
 */
function _runWorker(options, callback) {
  callback = callback || function() {};

  // get new worker ID
  var workerId = _createWorkerId();

  // lock duration is used to indicate when to forcibly override another
  // worker
  var now = new Date();
  var schedule = bedrock.config.scheduler.lockDuration;
  var expired = now.getTime() - schedule;

  // encode 'expired' as a worker ID (16 hex digit time + 24 zeros)
  expired = expired.toString(16);
  while(expired.length < 16) {
    expired = '0' + expired;
  }
  expired += '000000000000000000000000';

  /* Note: A worker will continue to run as long as it can mark a job to
  be executed. The query it will use will be for a specific job (if an ID is
  given) or for any job that meets the following criteria: it is due to be
  scheduled, it has a supported job type, its worker ID is expired, and it has
  maximum priority of other jobs that meet the same criteria. */

  // build query to mark jobs
  var query = {};
  if(options.id && options.type) {
    if(!(options.type in jobTypes)) {
      return callback(new BedrockError(
        'Could not run job; unknown job type was specified.',
        MODULE_NS + '.InvalidArguments'));
    }
    query.id = bedrock.db.hash(options.id);
    query['job.type'] = options.type;
  }
  else {
    // only mark jobs that have an expired worker ID
    query.worker = {$lte: expired};
    // only mark jobs with supported type
    query['job.type'] = {$in: Object.keys(jobTypes)};
    // TODO: mark job with highest priority
  }

  bedrock.logger.debug(
    'running job worker (' + workerId + ') to execute scheduled' +
    (options.type ? (' "' + options.type + '"') : '') + ' job' +
    (options.id ? (' "' + options.id + '"') : 's') + '...');

  // single update and new record retrieval db write options
  var singleUpdate = bedrock.tools.extend(
    {}, bedrock.db.writeOptions, {upsert: false, multi: false});

  // run algorithm on all matching entries
  var done = false;
  async.until(function() {return done;}, function(loopCallback) {
    // mark jobs that are scheduled to run now (update time)
    query.due = {$lte: Date.now()};
    async.waterfall([
      function(callback) {
        bedrock.db.collections.job.update(
          query, {$set: {'meta.updated': Date.now(), workerId: workerId}},
          singleUpdate, function(err) {
            callback(err);
          });
      },
      function(callback) {
        // fetch any marked job
        var markedQuery = {workerId: workerId};
        if(query.id) {
          markedQuery.id = query.id;
        }
        bedrock.db.collections.job.findOne(markedQuery, {}, callback);
      },
      function(record, callback) {
        if(record === null) {
          if(options.id && options.type) {
            // error when job isn't found and a specific ID was given
            return callback(new BedrockError(
              'Job not found.',
              MODULE_NS + '.JobNotFound',
              {id: options.id, type: options.type}));
          }
          // done, no matching jobs remain
          done = true;
          return loopCallback();
        }

        bedrock.logger.debug(
          'job worker (' + workerId + ') executing "' + record.job.type +
          '" ' + ' job "' + record.job.id + '"...');

        callback(null, record);
      },
      function(record, callback) {
        var job = record.job;
        try {
          jobTypes[job.type].fn(function(err) {
            callback(null, record, err || null);
          });
        }
        catch(ex) {
          callback(null, record, ex || null);
        }
      },
      function(job, error, callback) {
        var logFn = error ? bedrock.logger.error : bedrock.logger.debug;
        logFn(
          'job worker (' + workerId + ') completed "' + job.type +
          '" ' + ' job "' + job.id + '"' +
          (error ? ' with error' : ''), error || undefined);

        // calculate next time to run job
        var due = _getNextJobSchedule(job, {update: true});
        bedrock.db.collections.job.update(
          {id: bedrock.db.hash(job.id), 'job.type': job.type},
          {$set: {
            'meta.updated': Date.now(),
            workerId: '0',
            due: due,
            completed: Date.now()
          }}, singleUpdate, function(err) {
            callback(err);
          });
      }
    ], function(err) {
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
        bedrock.events.emit(event);
      }, options.reschedule);
    }
    if(callback) {
      callback(err);
    }
  });
}
