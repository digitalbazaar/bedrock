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

  // setup config vars for templating
  grunt.config('dirs', {
    'bedrock': __dirname
  });

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
          'site/static/css/app.css',
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
      src: ['<%= dirs.bedrock %>/site/static/app/components/**/*.html'],
      dest: 'site/static/app/templates.min.js'
    }
  });

  // requirejs
  grunt.loadNpmTasks('grunt-contrib-requirejs');
  grunt.config('requirejs', {
    compile: {
      options: {
        baseUrl: '<%= dirs.bedrock %>/site/static',
        paths: {
          'almond': '<%= dirs.bedrock %>/bower_components/almond/almond',
          'angular': '<%= dirs.bedrock %>/bower_components/angular/angular',
          'angular-animate': '<%= dirs.bedrock %>/bower_components/angular-animate/angular-animate',
          'angular-bootstrap': '<%= dirs.bedrock %>/bower_components/angular-bootstrap/ui-bootstrap-tpls',
          'angular-route': '<%= dirs.bedrock %>/bower_components/angular-route/angular-route',
          'angular-sanitize': '<%= dirs.bedrock %>/bower_components/angular-sanitize/angular-sanitize',
          'angular-ui-select': '<%= dirs.bedrock %>/bower_components/angular-ui-select/dist/select',
          'bedrock': '.',
          'bootstrap': '<%= dirs.bedrock %>/bower_components/bootstrap/dist/js/bootstrap',
          'dialog-polyfill': '<%= dirs.bedrock %>/bower_components/dialog-polyfill/dialog-polyfill',
          'forge': '<%= dirs.bedrock %>/bower_components/forge/js',
          'iso8601': '<%= dirs.bedrock %>/lib/iso8601/iso8601',
          'jquery': '<%= dirs.bedrock %>/bower_components/jquery/dist/jquery',
          'jquery-migrate': '<%= dirs.bedrock %>/bower_components/jquery-migrate/jquery-migrate',
          'jsonld': '<%= dirs.bedrock %>/bower_components/jsonld/js/jsonld',
          'ng-multi-transclude': '<%= dirs.bedrock %>/bower_components/ng-multi-transclude/src/multi-transclude',
          'opencred-verifier': '<%= dirs.bedrock %>/bower_components/opencred-verifier/lib/credentialVerifier',
          'promise': '<%= dirs.bedrock %>/bower_components/es6-promise/promise',
          'stackables': '<%= dirs.bedrock %>/bower_components/angular-stackables/stackables',
          'underscore': '<%= dirs.bedrock %>/bower_components/underscore/underscore',
          // override templates
          'app/templates': 'app/templates.min'
        },
        mainConfigFile: '<%= dirs.bedrock %>/site/static/app/main.js',
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
        'bin/**/*.js',
        'configs/*.js',
        'email-templates/*.js',
        'lib/*.js',
        'lib/**/*.js',
        'locales/*.js',
        'schemas/*.js',
        'site/static/app/*.js',
        'site/static/app/**/*.js'//,
        //'tests/*.js',
        //'tests/**/*.js'
      ]
    }
  });

  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.config('less', {
    compileApp: {
      options: {
        strictMath: true,
        sourceMap: false,
        outputSourceFiles: false
      },
      files: {
        'site/static/css/app.css': 'less/app.less'
      }
    }
  });

  grunt.registerTask('compile-css', ['less:compileApp']);

  // default tasks
  grunt.registerTask('default', ['ngtemplates', 'cssmin', 'requirejs']);
};
