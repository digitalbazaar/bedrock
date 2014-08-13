/*!
 * RequireJS config.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
(function() {

'use strict';

// define console.log for IE
window.console = window.console || {};
window.console.log = window.console.log || function() {};

require.config({
  baseUrl: '/',
  paths: {
    angular: 'bower-components/angular/angular',
    'angular-animate': 'bower-components/angular-animate/angular-animate',
    'angular-bootstrap': 'bower-components/angular-bootstrap/ui-bootstrap-tpls',
    'angular-route': 'bower-components/angular-route/angular-route',
    'angular-sanitize': 'bower-components/angular-sanitize/angular-sanitize',
    'angular-ui-select2': 'bower-components/angular-ui-select2/src/select2',
    bedrock: '.',
    bootstrap: 'bower-components/bootstrap/dist/js/bootstrap',
    'dialog-polyfill': 'bower-components/dialog-polyfill/dialog-polyfill',
    iso8601: 'iso8601/iso8601',
    jquery: 'bower-components/jquery/dist/jquery',
    'jquery.bedrock': 'jquery/jquery.bedrock',
    'jquery-migrate': 'bower-components/jquery-migrate/jquery-migrate',
    'jquery.placeholder': 'jquery/jquery.placeholder',
    jsonld: 'jsonld/jsonld',
    'opencred-verifier': 'opencred-verifier/credentialVerifier',
    promise: 'promise/promise',
    select2: 'bower-components/select2/select2',
    spin: 'spin/spin',
    stackables: 'bower-components/angular-stackables/stackables',
    underscore: 'underscore/underscore'
  },
  shim: {
    // export globals for non-requireJS libs
    angular: {exports: 'angular', deps: ['jquery']},
    'angular-animate': {deps: ['angular']},
    'angular-bootstrap': {deps: ['angular']},
    'angular-route': {deps: ['angular']},
    'angular-sanitize': {deps: ['angular']},
    'angular-ui-select2': {deps: ['angular', 'select2']},
    bootstrap: {deps: ['jquery', 'jquery-migrate']},
    'dialog-polyfill': {exports: 'dialogPolyfill'},
    iso8601: {exports: 'iso8601'},
    jquery: {exports: 'jQuery'},
    'jquery.bedrock': {deps: ['jquery']},
    'jquery-migrate': {deps: ['jquery.bedrock']},
    'jquery.placeholder': {deps: ['jquery']},
    select2: {deps: ['angular'], exports: 'Select2'},
    spin: {exports: 'Spinner'},
    stackables: {deps: ['angular', 'dialog-polyfill']},
    underscore: {exports: '_'}
  },
  // preload customizable app bootstrap module
  deps: ['app/bootstrap'],
  callback: function() {
    require(['app/app'], function() {});
  }
});

})();
