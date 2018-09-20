/*
 * Copyright (c) 2012-2015 Digital Bazaar, Inc. All rights reserved.
 */
const events = {
  EventEmitter: require('async-node-events')
};

const api = new events.EventEmitter();
api.setMaxListeners(0);
api.removeAllListeners('maxListenersPassed');
module.exports = api;

// store original emit function
const emit = api.emit;

/**
 * Emits an event just like the standard EventEmitter does, however, if the
 * last parameter passed is a function, it is assumed to be a callback that
 * will be called once the event has propagated to all listeners or it has
 * been canceled due to an error.
 *
 * Note that this module also permits listeners to be executed asynchronously.
 * Any asynchronous listeners will be notified of an event in order of
 * registration. Each listener will block the next listener to receive the
 * event until the callback that is passed to it is called. If an error is
 * passed as the first parameter to the callback, then the event will be
 * canceled.
 *
 * Backwards-compatibility support exists for the deprecated method of passing
 * the first argument as an object with a 'type' property that indicates the
 * event type.
 *
 * So two forms are available:
 * * The standard emit() usage of an event type and an arbitrary number of
 *   arguments.
 * * DEPRECATED: A single event object argument with the following fields:
 *     type: event type (string)
 *     time: event time (Date, optional, added if omitted)
 *     details: event details (object)
 *
 * @return a Promise that resolves to undefined once the event has been emitted
 *         to all listeners (or to `false` if it was canceled).
 */
api.emit = function(event /* ... */) {
  let args;
  // check for event object
  if(typeof event === 'object' && event.type) {
    // add time if not present
    event.time = event.time || new Date();
    args = [event.type, event];
  } else {
    // otherwise assume regular emit call
    args = Array.prototype.slice.call(arguments);
  }

  // default callback
  let callback = () => {};
  if(typeof args[args.length - 1] === 'function') {
    // save `callback` to call once `emit` completes
    callback = args[args.length - 1];
    args.pop();
  }

  // call callback that resolves promise
  const deferred = {};
  const promise = new Promise((resolve, reject) => {
    deferred.resolve = resolve;
    deferred.reject = reject;
  });
  args.push((err, result) => {
    if(err) {
      deferred.reject(err);
    } else {
      deferred.resolve(result);
    }
    callback(err, result);
  });

  // emit
  emit.apply(api, args);
  return promise;
};

/**
 * Schedules an event to be emitted on the next tick (via process.nextTick).
 *
 * Backwards-compatibility support exists for the deprecated method of passing
 * the first argument as an object with a 'type' property that indicates the
 * event type.
 *
 * So two forms are available:
 * * The standard emit() usage of an event type and an arbitrary number of
 *   arguments.
 * * DEPRECATED: A single event object argument with the following fields:
 *     type: event type (string)
 *     time: event time (Date, optional, added if omitted)
 *     details: event details (object)
 *
 * @return a Promise that resolves to undefined once the event has been emitted
 *         to all listeners (or to `false` if it was canceled).
 */
api.emitLater = function(/* ... */) {
  // emit asynchronously
  const args = arguments;
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      api.emit.apply(api, args).then(resolve, reject);
    });
  });
};
