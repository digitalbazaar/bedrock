var config = require('../lib/bedrock').config;

// identities
config.identity.identities.push({
  '@context': config.constants.IDENTITY_CONTEXT_V1_URL,
  type: 'Identity',
  sysSlug: 'bedrock',
  label: 'Bedrock',
  email: 'bedrock@bedrock.dev',
  sysPassword: 'password',
  sysResourceRole: [{
    sysRole: 'identity.registered',
    generateResource: 'id'
  }]
});
config.identity.identities.push({
  '@context': config.constants.IDENTITY_CONTEXT_V1_URL,
  type: 'Identity',
  sysSlug: 'dev',
  label: 'Dev',
  email: 'dev@bedrock.dev',
  sysPassword: 'password',
  sysResourceRole: [{
    sysRole: 'identity.registered',
    generateResource: 'id'
  }]
});

// identity service
config.identity.owner =
  config.server.baseUri + config.identity.basePath + '/bedrock';
