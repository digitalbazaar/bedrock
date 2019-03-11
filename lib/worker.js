/*!
 * Copyright (c) 2012-2019 Digital Bazaar, Inc. All rights reserved.
 */
'use strict';

// wait for initialization options from master
process.on('message', init);

// notify master to send initialization options
process.send({type: 'bedrock.worker.started'});

function init(msg) {
  if(!(typeof msg === 'object' && msg.type === 'bedrock.worker.init')) {
    return;
  }
  process.removeListener('message', init);

  // ensure current working directory is correct
  if(msg.cwd && process.cwd() !== msg.cwd) {
    process.chdir(msg.cwd);
  }

  require(msg.script);
}
