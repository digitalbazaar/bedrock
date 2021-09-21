/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const {EventEmitter} = require('async-node-events');

const api = new EventEmitter();
api.setMaxListeners(Infinity);
api.removeAllListeners('maxListenersPassed');
module.exports = api;

/**
 * Schedules an event to be emitted on the next tick (via process.nextTick).
 *
 * @return a Promise that resolves to undefined once the event has been emitted
 *         to all listeners (or to `false` if it was canceled).
 */
api.emitLater = function(...args) {
  // emit asynchronously
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      api.emit(...args).then(resolve, reject);
    });
  });
};
