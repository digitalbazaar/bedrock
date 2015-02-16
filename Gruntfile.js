/*
 * Bedrock Gruntfile.
 *
 * Copyright (c) 2013-2015 Digital Bazaar, Inc. All rights reserved.
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

  // read package configuration
  grunt.config('pkg', grunt.file.readJSON('package.json'));

  var _js = [
    '*.js',
    'bin/*.js',
    'bin/**/*.js',
    'configs/*.js',
    'lib/*.js',
    'lib/**/*.js',
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

  var _jscsOptions = {
    config: '<%= dirs.bedrock %>/.jscsrc',
    excludeFiles: []
  };
  if(grunt.config('ci')) {
    _jscsOptions.reporter = 'checkstyle';
    _jscsOptions.reporterOutput = 'reports/jscs.xml';
  }

  grunt.loadNpmTasks("grunt-jscs");
  grunt.config('jscs', {
    all: {
      options: _jscsOptions,
      src: _js
    }
  });

  // default tasks
  grunt.registerTask('default', []);
};
