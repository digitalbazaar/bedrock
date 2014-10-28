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

  // auto-generate local requirejs paths from main config
  var requirejsMain = require('./site/static/app/main.js');
  var requirejsPaths = {};
  for(var key in requirejsMain.paths) {
    var path = requirejsMain.paths[key];
    requirejsPaths[key] = path.replace(
      /^bower-components/g, '<%= dirs.bedrock %>/bower_components');
  }

  // overrides
  requirejsPaths.almond = '<%= dirs.bedrock %>/bower_components/almond/almond';
  requirejsPaths.iso8601 = '<%= dirs.bedrock %>/lib/iso8601/iso8601';
  requirejsPaths['app/templates'] = 'app/templates.min';

  grunt.config('requirejs', {
    compile: {
      options: {
        baseUrl: '<%= dirs.bedrock %>/site/static',
        paths: requirejsPaths,
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

  var _js = [
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
  ];

  // _jshint
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.config('jshint', {
    all: {
      options: grunt.config('ci') ? {
        reporter: 'checkstyle',
        reporterOutput: 'reports/jshint.xml'
      } : {},
      src: _js
    }
  });

  grunt.loadNpmTasks("grunt-jscs");
  grunt.config('jscs', {
    all: {
      options: grunt.config('ci') ? {
        reporter: 'checkstyle',
        reporterOutput: 'reports/jscs.xml'
      } : {},
      src: _js
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
