var config = require(__libdir + '/bedrock').config;
var baseUri = config.root.baseUri;
var rootId = config.root.id;

// profiles
config.profile.profiles.push({
  id: baseUri + '/profiles/root',
  type: 'Profile',
  psaSlug: 'root',
  email: 'root@bedrock.dev',
  label: 'Bedrock Development Root User',
  psaPassword: 'password',
  psaRole: [baseUri + '/roles/root']
});
config.profile.profiles.push({
  id: baseUri + '/profiles/dev',
  type: 'Profile',
  psaSlug: 'dev',
  email: 'dev@bedrock.dev',
  label: 'Dev',
  psaPassword: 'password',
  psaRole: [baseUri + '/roles/profile_registered']
});

// identities
config.identity.identities.push({
  id: rootId,
  owner: baseUri + '/profiles/root',
  psaSlug: 'root',
  psaPublic: ['label', 'website', 'description'],
  label: 'Bedrock Root User',
  website: baseUri,
  description: 'Bedrock Root User'
});
config.identity.identities.push({
  id: baseUri + '/i/dev',
  type: 'PersonalIdentity',
  owner: baseUri + '/profiles/dev',
  psaSlug: 'dev',
  label: 'Dev'
});
