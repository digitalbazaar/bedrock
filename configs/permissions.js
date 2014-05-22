var config = require(GLOBAL.__libdir + '/bedrock').config;

var permissions = config.permission.permissions;

// identity permissions
permissions.IDENTITY_ADMIN = {
  id: 'IDENTITY_ADMIN',
  label: 'Identity Administration',
  comment: 'Required to administer Identities.'
};
permissions.IDENTITY_ACCESS = {
  id: 'IDENTITY_ACCESS',
  label: 'Access Identity',
  comment: 'Required to access an Identity.'
};
permissions.IDENTITY_CREATE = {
  id: 'IDENTITY_CREATE',
  label: 'Create Identity',
  comment: 'Required to create an Identity.'
};
permissions.IDENTITY_EDIT = {
  id: 'IDENTITY_EDIT',
  label: 'Edit Identity',
  comment: 'Required to edit an Identity.'
};
permissions.IDENTITY_REMOVE = {
  id: 'IDENTITY_REMOVE',
  label: 'Remove Identity',
  comment: 'Required to remove an Identity.'
};
permissions.PUBLIC_KEY_CREATE = {
  id: 'PUBLIC_KEY_CREATE',
  label: 'Create Public Key',
  comment: 'Required to create a Public Key.'
};
permissions.PUBLIC_KEY_REMOVE = {
  id: 'PUBLIC_KEY_REMOVE',
  label: 'Remove Public Key',
  comment: 'Required to remove a Public Key.'
};

// website permissions
permissions.WEBSITE_ADMIN = {
  id: 'WEBSITE_ADMIN',
  label: 'Website Administration',
  comment: 'Required to administer website services.'
};
