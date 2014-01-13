var config = require(__libdir + '/bedrock').config;

config.permission.roles.push({
  id: config.server.baseUri + '/roles/profile_administrator',
  label: 'Profile Administrator',
  comment: 'Role for profile administrators.',
  psaPermission: [
    {id: 'bedrock.profile.permission.profile_admin'},
    {id: 'bedrock.profile.permission.profile_access'},
    {id: 'bedrock.profile.permission.profile_create'},
    {id: 'bedrock.profile.permission.profile_edit'},
    {id: 'bedrock.profile.permission.profile_remove'}
  ]
});
config.permission.roles.push({
  id: config.server.baseUri + '/roles/profile_manager',
  label: 'Registered Profile',
  comment: 'Role for registered profiles.',
  psaPermission: [
    {id: 'bedrock.profile.permission.profile_access'},
    {id: 'bedrock.profile.permission.profile_create'},
    {id: 'bedrock.profile.permission.profile_edit'},
    {id: 'bedrock.profile.permission.promo_redeem_code'}
  ]
});
config.permission.roles.push({
  id: config.server.baseUri + '/roles/role_administrator',
  label: 'Role Administrator',
  comment: 'This role is used to administer Roles and Permissions.',
  psaPermission: [
    {id: 'bedrock.profile.permission.role_admin'},
    {id: 'bedrock.profile.permission.role_edit'},
    {id: 'bedrock.profile.permission.role_remove'}
  ]
});
config.permission.roles.push({
  id: config.server.baseUri + '/roles/identity_administrator',
  label: 'Identity Administrator',
  comment: 'Role for Identity administrators.',
  psaPermission: [
    {id: 'bedrock.identity.permission.identity_admin'},
    {id: 'bedrock.identity.permission.identity_access'},
    {id: 'bedrock.identity.permission.identity_create'},
    {id: 'bedrock.identity.permission.identity_edit'},
    {id: 'bedrock.identity.permission.identity_remove'},
    {id: 'bedrock.identity.permission.public_key_create'},
    {id: 'bedrock.identity.permission.public_key_remove'}
  ]
});
config.permission.roles.push({
  id: config.server.baseUri + '/roles/identity_manager',
  label: 'Identity Manager',
  comment: 'Role for identity managers.',
  psaPermission: [
    {id: 'bedrock.identity.permission.identity_access'},
    {id: 'bedrock.identity.permission.identity_create'},
    {id: 'bedrock.identity.permission.identity_edit'},
    {id: 'bedrock.identity.permission.public_key_create'},
    {id: 'bedrock.identity.permission.public_key_remove'}
  ]
});
config.permission.roles.push({
  id: config.server.baseUri + '/roles/website_administrator',
  label: 'Website Administrator',
  comment: 'This role is used to administer the website.',
  psaPermission: [
    {id: 'bedrock.website.permission.admin'}
  ]
});

// admin role contains all permissions
config.permission.roles.push({
  id: config.server.baseUri + '/roles/admin',
  label: 'Administrator',
  comment: 'Role for System Administrator.',
  psaPermission: [
    // profile permissions
    {id: 'bedrock.profile.permission.profile_admin'},
    {id: 'bedrock.profile.permission.profile_access'},
    {id: 'bedrock.profile.permission.profile_create'},
    {id: 'bedrock.profile.permission.profile_edit'},
    {id: 'bedrock.profile.permission.profile_remove'},
    // role permissions
    {id: 'bedrock.permission.permission.role_admin'},
    {id: 'bedrock.permission.permission.role_edit'},
    {id: 'bedrock.permission.permission.role_remove'},
    // identity permissions
    {id: 'bedrock.identity.permission.identity_admin'},
    {id: 'bedrock.identity.permission.identity_access'},
    {id: 'bedrock.identity.permission.identity_create'},
    {id: 'bedrock.identity.permission.identity_edit'},
    {id: 'bedrock.identity.permission.identity_remove'},
    {id: 'bedrock.identity.permission.public_key_create'},
    {id: 'bedrock.identity.permission.public_key_remove'},
    // website permissions
    {id: 'bedrock.website.permission.admin'}
  ]
});

// default registered profile role (contains all permissions for a regular
// profile)
config.permission.roles.push({
  id: config.server.baseUri + '/roles/profile_registered',
  label: 'Registered Profile',
  comment: 'Role for registered profiles.',
  psaPermission: [
    // profile permissions
    {id: 'bedrock.profile.permission.profile_access'},
    {id: 'bedrock.profile.permission.profile_create'},
    {id: 'bedrock.profile.permission.profile_edit'},
    // identity permissions
    {id: 'bedrock.identity.permission.identity_access'},
    {id: 'bedrock.identity.permission.identity_create'},
    {id: 'bedrock.identity.permission.identity_edit'},
    {id: 'bedrock.identity.permission.public_key_create'},
    {id: 'bedrock.identity.permission.public_key_remove'}
  ]
});
