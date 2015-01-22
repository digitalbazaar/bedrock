/*
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 */
var bedrock = require('./lib/bedrock');

// running in development mode
// load dev config and start
require('./configs/dev');
bedrock.start({script: __filename});
