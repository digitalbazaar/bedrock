/*
 * Bedrock Gruntfile.
 *
 * Copyright (c) 2013-2014 Digital Bazaar, Inc. All rights reserved.
 */
module.exports = function(grunt) {
  'use strict';

  // init config
  grunt.initConfig({});

  // set mode to either 'default' or 'ci'
  grunt.config('mode',
    grunt.option('mode') || process.env.GRUNT_MODE || 'default');
  // check for ci mode
  grunt.config('ci', grunt.option('mode') === 'ci');

  // optimization flag (any require.js mode, ie, 'uglify', 'none', etc
  grunt.config('optimize',
    grunt.option('optimize') || process.env.GRUNT_OPTIMIZE || 'uglify');

  // read package configuration
  grunt.config('pkg', grunt.file.readJSON('package.json'));

  // cssmin
  grunt.loadNpmTasks('grunt-contrib-cssmin');
  grunt.config('cssmin', {
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
          'bower_components/select2/select2.css',
          'bower_components/select2/select2-bootstrap.css',
          'bower_components/angular-stackables/stackables.css',
          'site/static/css/common.css',
          'site/static/css/custom.css'
        ]
      }
    }
  });

  // angular templates
  grunt.loadNpmTasks('grunt-angular-templates');
  grunt.config('ngtemplates', {
    myapp: {
      options: {
        // the module the templates will be added to
        module: 'app.templates',
        htmlmin: {
          collapseBooleanAttributes:      false,
          collapseWhitespace:             true,
          removeAttributeQuotes:          false,
          removeComments:                 true,
          removeEmptyAttributes:          false,
          removeEmptyElements:            false,
          removeRedundantAttributes:      false,
          removeScriptTypeAttributes:     false,
          removeStyleLinkTypeAttributes:  false,
          removeOptionalTags:             false
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
      src: 'site/static/app/**/*.html',
      dest: 'site/static/app/templates.min.js'
    }
  });

  // requirejs
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.config('requirejs', {
    compile: {
      options: {
        baseUrl: 'site/static',
        paths: {
          'almond': '../../node_modules/almond/almond',
          'angular-ui-select2': '../../bower_components/angular-ui-select2/src/select2',
          'forge': '../../node_modules/node-forge/js',
          'iso8601': '../../lib/iso8601/is8601',
          'jsonld': '../../node_modules/jsonld/js/jsonld',
          'jquery': '../../bower_components/jquery/dist/jquery',
          'jquery-migrate': '../../bower_components/jquery-migrate/jquery-migrate',
          'opencred-verifier': '../../node_modules/opencred-verifier/lib/credentialVerifier',
          'promise': '../../node_modules/es6-promise/dist/promise-1.0.0',
          'select2': '../../bower_components/select2/select2',
          'stackables': '../../bower_components/angular-stackables/stackables',
          'underscore': '../../node_modules/underscore/underscore',
          // override templates
          'app/templates': 'app/templates.min'
        },
        mainConfigFile: 'site/static/app/main.js',
        name: 'almond',
        include: ['app/main'],
        insertRequire: ['app/main'],
        out: 'site/static/app/main.min.js',
        wrap: true,
        preserveLicenseComments: false,
        optimize: grunt.config('optimize'),
        onBuildRead: function(moduleName, path, contents) {
          if(path.indexOf('site/static/app') === -1) {
            return contents;
          }
          var ngAnnotate = require('ng-annotate');
          var result = ngAnnotate(contents, {
            add: true,
            single_quotes: true
          });
          if(result.errors) {
            console.log('ng-annotate failed for ' +
              'moduleName="' + moduleName + '", path="' + path + '", ' +
              'errors=', result.errors);
            process.exit();
          }
          return result.src;
        }
      }
    }
  });

  // _jshint
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.config('jshint', {
    all: {
      options: grunt.config('ci') ? {
        reporter: 'checkstyle',
        reporterOutput: 'reports/jshint.xml'
      } : {},
      src: [
        '*.js',
        'bin/*.js',
        'configs/*.js',
        'email-templates/*.js',
        'lib/*.js',
        'lib/**/*.js',
        'locales/*.js',
        'schemas/*.js',
        'site/static/app/*.js',
        'site/static/app/**/*.js',
        'test/*.js'
      ]
    }
  });

  // default tasks
  grunt.registerTask('default', ['ngtemplates', 'cssmin', 'requirejs']);
};
