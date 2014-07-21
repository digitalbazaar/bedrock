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
    angular: 'angular/angular',
    'angular-route': 'angular/angular-route',
    'angular-sanitize': 'angular/angular-sanitize',
    'angular-ui-select2': 'bower-components/angular-ui-select2/src/select2',
    bedrock: '.',
    bootstrap: 'bootstrap/js/bootstrap',
    'dialog-polyfill': 'bower-components/dialog-polyfill/dialog-polyfill',
    iso8601: 'iso8601/iso8601',
    jquery: 'jquery/jquery',
    'jquery.placeholder': 'jquery/jquery.placeholder',
    jsonld: 'jsonld/jsonld',
    'opencred-verifier': 'opencred-verifier/credentialVerifier',
    promise: 'promise/promise',
    select2: 'bower-components/select2/select2',
    spin: 'spin/spin',
    stackables: 'bower-components/angular-stackables/stackables',
    'ui-bootstrap': 'angular-ui/ui-bootstrap-tpls',
    'ui-utils': 'angular-ui/ui-utils',
    'ui-utils-ieshiv': 'angular-ui/ui-utils-ieshiv',
    underscore: 'underscore/underscore'
  },
  shim: {
    // export globals for non-requireJS libs
    angular: {exports: 'angular', deps: ['jquery']},
    'angular-route': {deps: ['angular']},
    'angular-sanitize': {deps: ['angular']},
    'angular-ui-select2': {deps: ['angular', 'select2']},
    bootstrap: {deps: ['jquery']},
    'dialog-polyfill': {exports: 'dialogPolyfill'},
    iso8601: {exports: 'iso8601'},
    jquery: {exports: 'jQuery'},
    'jquery.placeholder': {deps: ['jquery']},
    select2: {deps: ['angular'], exports: 'Select2'},
    spin: {exports: 'Spinner'},
    stackables: {deps: ['angular', 'dialog-polyfill']},
    'ui-bootstrap': {deps: ['angular']},
    'ui-utils': {deps: ['angular', 'ui-utils-ieshiv']},
    underscore: {exports: '_'}
  },
  // preload customizable app bootstrap module
  deps: ['app/bootstrap'],
  callback: function() {
    require(['app/app'], function() {});
  }
});

})();
