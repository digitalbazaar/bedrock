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
          base: 'site/static',
          // prepend path to $templateCache ID
          prepend: '/',
          // the module the templates will be added to
          module: {
            name: 'app.templates',
            define: true
          },
          htmlmin: {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             true,
            removeAttributeQuotes:          true,
            removeComments:                 true,
            removeEmptyAttributes:          true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
          }
        },
        src: 'site/static/app/templates/**/*.html',
        dest: 'site/static/app/templates.min.js'
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
        'site/static/app/*.js',
        'site/static/app/**/*.js',
        'site/static/legacy/*.js',
        'test/*.js'
      ]
    }
  });

  // plugins
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  grunt.registerTask('templates2requireJS', function() {
    var filename = path.join(__dirname, 'site/static/app/templates.min.js');
    var module = fs.readFileSync(filename, 'utf8');
    module = "define(['angular'], function(angular) {\n" + module + '});\n';
    fs.writeFileSync(filename, module);
  });

  // default tasks
  grunt.registerTask('default', ['ngtemplates', 'templates2requireJS']);
};
