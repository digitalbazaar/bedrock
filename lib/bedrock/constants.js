/*
 * Copyright (c) 2013-2014 Digital Bazaar, Inc. All rights reserved.
 */
var api = {};
module.exports = api;

/**
 * Versioned Bedrock JSON-LD context URLs.
 */
api.CONTEXT_V1_URL = 'https://w3id.org/bedrock/v1';

/**
 * Supported Bedrock JSON-LD contexts.
 *
 * This object can be extended from other modules to add support for
 * hardcoded contexts.
 */
api.CONTEXTS = {};

/**
 * V1 Bedrock JSON-LD context.
 */
api.CONTEXTS[api.CONTEXT_V1_URL] = {
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
 * Default Bedrock JSON-LD context URL.
 */
api.CONTEXT_URL = api.CONTEXT_V1_URL;

/**
 * Default Bedrock JSON-LD context.
 */
api.CONTEXT = api.CONTEXTS[api.CONTEXT_URL];
