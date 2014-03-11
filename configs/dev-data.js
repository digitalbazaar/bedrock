var config = require(__libdir + '/bedrock').config;

// identities
config.identity.identities.push({
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
