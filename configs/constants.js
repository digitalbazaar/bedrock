var config = require(__libdir + '/config');

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
constants.CONTEXTS[constants.CONTEXT_V1_URL] = {
  // aliases
  id: '@id',
  type: '@type',

  // prefixes
  bed: 'http://w3id.org/bedrock#',
  dc: 'http://purl.org/dc/terms/',
  foaf: 'http://xmlns.com/foaf/0.1/',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  sec: 'https://w3id.org/security#',
  vcard: 'http://www.w3.org/2006/vcard/ns#',
  xsd: 'http://www.w3.org/2001/XMLSchema#',

  // bedrock
  PersonalIdentity: 'bed:PersonalIdentity',
  Profile: 'bed:Profile',

  // general
  address: {'@id': 'vcard:adr', '@type': '@id'},
  comment: 'rdfs:comment',
  countryName: 'vcard:country-name',
  created: {'@id': 'dc:created', '@type': 'xsd:dateTime'},
  creator: {'@id': 'dc:creator', '@type': '@id'},
  depiction: {'@id': 'foaf:depiction', '@type': '@id'},
  description: 'dc:description',
  email: 'foaf:mbox',
  fullName: 'vcard:fn',
  label: 'rdfs:label',
  locality: 'vcard:locality',
  postalCode: 'vcard:postal-code',
  region: 'vcard:region',
  streetAddress: 'vcard:street-address',
  title: 'dc:title',
  website: {'@id': 'foaf:homepage', '@type': '@id'},
  Address: 'vcard:Address',

  // error
  // FIXME: add error terms
  // 'errorMessage': 'err:message'

  // security
  cipherAlgorithm: 'sec:cipherAlgorithm',
  cipherData: 'sec:cipherData',
  cipherKey: 'sec:cipherKey',
  digestAlgorithm: 'sec:digestAlgorithm',
  digestValue: 'sec:digestValue',
  expires: {'@id': 'sec:expiration', '@type': 'xsd:dateTime'},
  initializationVector: 'sec:initializationVector',
  nonce: 'sec:nonce',
  normalizationAlgorithm: 'sec:normalizationAlgorithm',
  owner: {'@id': 'sec:owner', '@type': '@id'},
  password: 'sec:password',
  privateKey: {'@id': 'sec:privateKey', '@type': '@id'},
  privateKeyPem: 'sec:privateKeyPem',
  publicKey: {'@id': 'sec:publicKey', '@type': '@id'},
  publicKeyPem: 'sec:publicKeyPem',
  publicKeyService: {'@id': 'sec:publicKeyService', '@type': '@id'},
  revoked: {'@id': 'sec:revoked', '@type': 'xsd:dateTime'},
  signature: 'sec:signature',
  signatureAlgorithm: 'sec:signatureAlgorithm',
  signatureValue: 'sec:signatureValue',
  EncryptedMessage: 'sec:EncryptedMessage',
  CryptographicKey: 'sec:Key',
  GraphSignature2012: 'sec:GraphSignature2012'
};

/**
 * Default main application JSON-LD context URL.
 */
constants.CONTEXT_URL = constants.CONTEXT_V1_URL;

/**
 * Default main application JSON-LD context.
 */
constants.CONTEXT = constants.CONTEXTS[constants.CONTEXT_URL];
