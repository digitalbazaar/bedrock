module.exports = function(grunt) {
  'use strict';

  // project configuration
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    cssmin: {
      combine: {
        options: {
          root: 'site/static/',
          report: 'min'
        },
        files: {
          'site/static/css/bundle.min.css': [
            'site/static/bootstrap/css/bootstrap.css',
            'site/static/bootstrap/css/bootstrap-responsive.css',
            'site/static/font-awesome/css/font-awesome.css',
            'site/static/css/common.css',
            'site/static/css/custom.css'
          ]
        }
      }
    },
    ngtemplates: {
      myapp: {
        options: {
          // the module the templates will be added to
          module: 'app.templates',
          htmlmin: {
            collapseBooleanAttributes:      true,
            collapseWhitespace:             true,
            removeAttributeQuotes:          true,
            removeComments:                 true,
            removeEmptyAttributes:          true,
            removeRedundantAttributes:      true,
            removeScriptTypeAttributes:     true,
            removeStyleLinkTypeAttributes:  true
          },
          bootstrap: function(module, script) {
            return [
              "define(['angular'], function(angular) {\n",
              "angular.module('" + module + "', [])",
              ".run(['$templateCache', function($templateCache) {\n",
              script,
              '}]);\n});\n'].join('');
          },
          url: function(file) {
            var idx = file.indexOf('site/static');
            file = file.substr(idx + 'site/static'.length);
            return file;
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
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.loadNpmTasks('grunt-contrib-jshint');

  // default tasks
  grunt.registerTask('default', ['ngtemplates', 'cssmin']);
};
