var config = require(__libdir + '/bedrock').config;

// identity config
config.identity.defaults.identity = {
  type: 'Identity',
  sysStatus: 'active',
  sysPublic: [],
  address: [],
  preferences: {
    type: 'IdentityPreferences'
  }
};

// default resource roles
config.identity.defaults.roles = [{
  sysRole: 'identity.registered'
}];
