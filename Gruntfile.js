var path = require('path');
var fs = require('fs');

module.exports = function(grunt) {
  'use strict';

  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    ngtemplates: {
      myapp: {
        options: {
          // $templateCache ID will be relative to this folder
          base: 'site/static/en',
          // prepend path to $templateCache ID
          prepend: '/',
          // the module the templates will be added to
          module: {
            name: 'app.templates',
            define: true
          }
        },
        src: 'site/static/en/app/templates/**/*.html',
        dest: 'site/static/en/app/templates.min.js'
      }
    },
    jshint: {
      all: [
        '*.js',
        'bin/*.js',
        'configs/*.js',
        'email-templates/*.js',
        'lib/*.js',
        'lib/**/*.js',
        'lib/**/**/*.js',
        'locales/*.js',
        'schemas/*.js',
        'site/static/en/app/*.js',
        'site/static/en/app/**/*.js',
        'site/static/en/legacy/*.js',
        'test/*.js'
      ]
    }
  });

  // plugins
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  
  grunt.registerTask('templates2requireJS', function() {
    var filename = path.join(__dirname, 'site/static/en/app/templates.min.js');
    var module = fs.readFileSync(filename, 'utf8');
    module = "define(['angular'], function(angular) {\n" + module + '});\n';
    fs.writeFileSync(filename, module);
  });

  // default tasks
  grunt.registerTask('default', ['ngtemplates', 'templates2requireJS']);
};
