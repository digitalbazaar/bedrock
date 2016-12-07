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

  // setup config vars for templating
  grunt.config('dirs', {
    'bedrock': __dirname,
    // main project dir, override for subprojects
    'main': __dirname
  });

  // read package configuration
  grunt.config('pkg', grunt.file.readJSON('package.json'));

  grunt.config('js', [
    '*.js',
    'bin/*.js',
    'bin/**/*.js',
    'configs/*.js',
    'lib/*.js',
    'lib/**/*.js'
    //'tests/*.js',
    //'tests/**/*.js'
  ]);

  // _jshint
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.config('jshint', {
    all: {
      options: grunt.config('ci') ? {
        jshintrc: true,
        reporter: 'checkstyle',
        reporterOutput: 'reports/jshint.xml'
      } : {
        jshintrc: true
      },
      src: grunt.config('js')
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

  grunt.loadNpmTasks('grunt-jscs');
  grunt.config('jscs', {
    all: {
      options: _jscsOptions,
      src: grunt.config('js')
    }
  });

  // default tasks
  grunt.registerTask('default', []);
};
