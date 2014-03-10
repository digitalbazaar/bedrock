var config = require(__libdir + '/bedrock').config;

// identity config
config.identity.defaults.identity = {
  type: 'Identity',
  sysStatus: 'active',
  sysRole: [config.server.baseUri + '/roles/identity_registered'],
  sysPublic: [],
  address: [],
  preferences: {
    type: 'IdentityPreferences'
  }
};
