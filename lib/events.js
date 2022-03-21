/*!
 * Copyright (c) 2012-2021 Digital Bazaar, Inc. All rights reserved.
 */
import {EventEmitter} from 'async-node-events';

const emitter = new EventEmitter();
emitter.setMaxListeners(Infinity);
emitter.removeAllListeners('maxListenersPassed');
export {emitter};

/**
 * Schedules an event to be emitted on the next tick (via process.nextTick).
 *
 * @param {Array} args - The arguments to emit.
 *
 * @returns {Promise} A Promise that resolves to undefined once the event has
 *   been emitted to all listeners (or to `false` if it was canceled).
 */
emitter.emitLater = function(...args) {
  // emit asynchronously
  return new Promise((resolve, reject) => {
    process.nextTick(() => {
      emitter.emit(...args).then(resolve, reject);
    });
  });
};
