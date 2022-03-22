/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
import cycle from 'cycle';
import Transport from 'winston-transport';

export class WorkerTransport extends Transport {
  constructor(config) {
    super(config);
    this.category = config.category;
    this.name = 'worker';
    this.workerId = config.workerId;
  }

  log(info, callback) {
    for(const key in info) {
      const value = info[key];
      // convert errors into objects
      if(value instanceof Error) {
        info[key] = {
          message: value.message,
          stack: value.stack,
          ...cycle.decycle(value)
        };
      } else {
        // decycle all other values
        info[key] = cycle.decycle(value);
      }
    }
    info.workerId = this.workerId;
    info.workerPid = process.pid;

    // send logger message to primary and ignore EPIPE errors that prevent the
    // message from reaching the primary because it has disconnected
    process.send({
      type: 'bedrock.logger',
      info,
      category: this.category
    }, _noop);

    callback();
  }
}

function _noop() {
}
