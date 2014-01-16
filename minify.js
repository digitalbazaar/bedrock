({
  baseUrl: 'site/static',
  paths: {
    'underscore': '../../../node_modules/underscore',
    // override templates
    'app/templates': 'app/templates.min'
  },
  mainConfigFile: 'site/static/app/main.js',
  name: '../../../node_modules/almond/almond',
  include: ['app/main'],
  insertRequire: ['app/main'],
  out: 'site/static/app/main.min.js',
  wrap: true,
  preserveLicenseComments: false
})
