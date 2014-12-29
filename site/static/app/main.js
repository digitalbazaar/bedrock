/*!
 * RequireJS config.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
(function(require) {

'use strict';

// define console.log for IE
if(typeof window !== 'undefined') {
  window.console = window.console || {};
  window.console.log = window.console.log || function() {};
}

// export main config if module API available
if(typeof module === 'object' && module.exports) {
  require = {config: function(cfg) { module.exports = cfg; }};
}

require.config({
  baseUrl: '/',
  paths: {
    angular: 'bower-components/angular/angular',
    'angular-animate': 'bower-components/angular-animate/angular-animate',
    'angular-bootstrap': 'bower-components/angular-bootstrap/ui-bootstrap-tpls',
    'angular-file-upload': 'bower-components/angular-file-upload/angular-file-upload',
    'angular-route': 'bower-components/angular-route/angular-route',
    'angular-sanitize': 'bower-components/angular-sanitize/angular-sanitize',
    'angular-ui-select': 'bower-components/angular-ui-select/dist/select',
    bedrock: '.',
    bootstrap: 'bower-components/bootstrap/dist/js/bootstrap',
    'dialog-polyfill': 'bower-components/dialog-polyfill/dialog-polyfill',
    forge: 'bower-components/forge/js',
    iso8601: 'iso8601/iso8601',
    jquery: 'bower-components/jquery/dist/jquery',
    'jquery.bedrock': 'jquery/jquery.bedrock',
    'jquery-migrate': 'bower-components/jquery-migrate/jquery-migrate',
    'jquery.placeholder': 'jquery/jquery.placeholder',
    jsonld: 'bower-components/jsonld/js/jsonld',
    'ng-multi-transclude': 'bower-components/ng-multi-transclude/src/multi-transclude',
    'opencred-verifier': 'bower-components/opencred-verifier/lib/credentialVerifier',
    promise: 'bower-components/es6-promise/promise',
    stackables: 'bower-components/angular-stackables/stackables',
    underscore: 'bower-components/underscore/underscore'
  },
  shim: {
    // export globals for non-requireJS libs
    angular: {exports: 'angular', deps: ['jquery']},
    'angular-animate': {deps: ['angular']},
    'angular-bootstrap': {deps: ['angular']},
    'angular-file-upload': {deps: ['angular']},
    'angular-route': {deps: ['angular']},
    'angular-sanitize': {deps: ['angular']},
    'angular-ui-select': {deps: ['angular']},
    bootstrap: {deps: ['jquery', 'jquery-migrate']},
    'dialog-polyfill': {exports: 'dialogPolyfill'},
    iso8601: {exports: 'iso8601'},
    jquery: {exports: 'jQuery'},
    'jquery.bedrock': {deps: ['jquery']},
    'jquery-migrate': {deps: ['jquery.bedrock']},
    'jquery.placeholder': {deps: ['jquery']},
    jsonld: {deps: ['promise']},
    'ng-multi-transclude': {deps: ['angular']},
    stackables: {deps: ['angular', 'dialog-polyfill']},
    underscore: {exports: '_'}
  },
  // preload customizable app bootstrap module
  deps: ['app/bootstrap'],
  callback: function() {
    require(['app/app'], function() {});
  }
});

})(require);
