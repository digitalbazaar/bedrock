var config = require('../lib/bedrock').config;

// identity config
config.identity.defaults.identity = {
  '@context': config.constants.IDENTITY_CONTEXT_V1_URL,
  type: 'Identity',
  address: [],
  preferences: {
    type: 'IdentityPreferences'
  },
  sysPublic: [],
  sysResourceRole: [{
    sysRole: 'identity.registered',
    generateResource: 'id'
  }],
  sysStatus: 'active'
};
