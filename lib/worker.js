/*!
 * Copyright (c) 2012-2022 Digital Bazaar, Inc. All rights reserved.
 */
// wait for initialization options from primary
process.on('message', init);

process.send({type: 'bedrock.worker.online'}, err => {
  if(err) {
    console.log(err);
    process.exit(1);
  }
});

function init(msg) {
  if(!(typeof msg === 'object' && msg.type === 'bedrock.worker.init')) {
    return;
  }
  process.removeListener('message', init);

  // ensure current working directory is correct
  if(msg.cwd && process.cwd() !== msg.cwd) {
    process.chdir(msg.cwd);
  }

  // set bedrock global
  global.bedrock = {main: msg.main, worker: {filename: msg.script}};

  import(msg.script).catch(e => {
    throw e;
  });
}
