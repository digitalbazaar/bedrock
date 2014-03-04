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
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
  rdfs: 'http://www.w3.org/2000/01/rdf-schema#',
  sec: 'https://w3id.org/security#',
  schema: 'http://schema.org/',
  xsd: 'http://www.w3.org/2001/XMLSchema#',

  // bedrock
  Identity: 'bed:lIdentity',
  Profile: 'bed:Profile',

  // general
  address: {'@id': 'schema:address', '@type': '@id'},
  addressCountry: 'schema:addressCountry',
  addressLocality: 'schema:addressLocality',
  addressRegion: 'schema:addressRegion',
  comment: 'rdfs:comment',
  created: {'@id': 'dc:created', '@type': 'xsd:dateTime'},
  creator: {'@id': 'dc:creator', '@type': '@id'},
  description: 'schema:description',
  email: 'schema:email',
  familyName: 'schema:familyName',
  givenName: 'schema:givenName',
  image: {'@id': 'schema:image', '@type': '@id'},
  label: 'rdfs:label',
  name: 'schema:name',
  postalCode: 'schema:postalCode',
  streetAddress: 'schema:streetAddress',
  title: 'dc:title',
  url: {'@id': 'schema:url', '@type': '@id'},
  PostalAddress: 'schema:PostalAddress',

  // error
  // FIXME: add error terms
  // 'errorMessage': 'err:message'

  // security
  credential: {'@id': 'sec:credential', '@type': '@id'},
  cipherAlgorithm: 'sec:cipherAlgorithm',
  cipherData: 'sec:cipherData',
  cipherKey: 'sec:cipherKey',
  claim: {'@id': 'sec:claim', '@type': '@id'},
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
