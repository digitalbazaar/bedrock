var config = require(__libdir + '/bedrock').config;

// profile config
config.profile.defaults = {
  profile: {
    sysStatus: 'active',
    sysRole: [config.server.baseUri + '/roles/profile_registered']
  }
};
