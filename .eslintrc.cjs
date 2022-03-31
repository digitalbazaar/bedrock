module.exports = {
  root: true,
  parserOptions: {
    // this is required for dynamic import()
    ecmaVersion: 2020
  },
  env: {
    node: true
  },
  extends: ['digitalbazaar', 'digitalbazaar/jsdoc'],
  ignorePatterns: ['node_modules/']
};
