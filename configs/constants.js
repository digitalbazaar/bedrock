var config = require('../lib/config');
var fs = require('fs');

var constants = config.constants = {};

/**
 * Versioned main application JSON-LD context URLs. An application that
 * extends bedrock is expected to override these and use them to version
 * its contexts.
 */
constants.CONTEXT_V1_URL = 'https://w3id.org/bedrock/v1';

/**
 * Supported JSON-LD contexts.
 *
 * This object can be extended to add support for hardcoded contexts.
 */
constants.CONTEXTS = {};

/**
 * V1 main application JSON-LD context.
 *
 * NOTE: If this context is overridden by an application extending bedrock,
 * then the new context must still define all of the properties that are used
 * by any bedrock modules that the application relies upon.
 */
constants.CONTEXTS[constants.CONTEXT_V1_URL] = JSON.parse(fs.readFileSync(
  __dirname + '/../site/static/contexts/bedrock-v1.jsonld',
  {encoding: 'utf8'}));

/**
 * Default main application JSON-LD context URL.
 */
constants.CONTEXT_URL = constants.CONTEXT_V1_URL;

/**
 * Default main application JSON-LD context.
 */
constants.CONTEXT = constants.CONTEXTS[constants.CONTEXT_URL];
