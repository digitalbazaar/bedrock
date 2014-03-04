var config = require(__libdir + '/bedrock').config;
var baseUri = config.server.baseUri;

// profiles
config.profile.profiles.push({
  type: 'Profile',
  sysSlug: 'dev',
  email: 'dev@bedrock.dev',
  label: 'Dev',
  sysPassword: 'password',
  sysRole: [baseUri + '/roles/profile_registered']
});

// identities
config.identity.identities.push({
  type: 'Identity',
  owner: baseUri + '/profiles/dev',
  sysSlug: 'dev',
  label: 'Dev'
});
