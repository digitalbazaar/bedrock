/*!
 * Copyright (c) 2012-2020 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

const Transport = require('winston-transport');

module.exports = class WorkerTransport extends Transport {
  constructor(config) {
    super(config);
    this.category = config.category;
    this.name = 'worker';
    this.workerId = config.workerId;
  }

  log(info, callback) {
    info.workerId = this.workerId;
    info.workerPid = process.pid;

    // send logger message to master
    process.send({
      type: 'bedrock.logger',
      info,
      category: this.category
    });

    callback();
  }
};
