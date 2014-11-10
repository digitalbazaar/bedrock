/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var events = require('events');

var api = new events.EventEmitter();
module.exports = api;

api.setMaxListeners(0);
// store original emit function
var emit = api.emit;

/**
 * Emit an event either by type name or with an event object. This function
 * overloads the standard EventEmitter emit() call and emits events
 * synchronously.
 *
 * Two forms are available:
 * * The standard emit() usage of an event type and an arbitrary number of
 *   arguments.
 * * An single event object argument with the following fields:
 *     type: event type (string)
 *     time: event time (Date, optional, added if omitted)
 *     details: event details (object)
 */
api.emit = api.emitSync = function(event /* ... */) {
  var args;
  // check for event object
  if(typeof event === 'object') {
    // add time if not present
    event.time = event.time || new Date();
    args = [event.type, event];
  } else {
    // otherwise assume regular emit call
    args = arguments;
  }
  // emit synchronously
  emit.apply(api, args);
};

/**
 * Emit an event either by type name or with an event object. This function
 * overloads the standard EventEmitter emit() call and emits events
 * asynchronously.
 *
 * Two forms are available:
 * * The standard emit() usage of an event type and an arbitrary number of
 *   arguments.
 * * An single event object argument with the following fields:
 *     type: event type (string)
 *     time: event time (Date, optional, added if omitted)
 *     details: event details (object)
 */
api.emitAsync = function(/* ... */) {
  // emit asynchronously
  var args = arguments;
  process.nextTick(function() {
    api.emit.apply(api, args);
  });
};
