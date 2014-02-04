/*!
 * RequireJS config.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
(function() {

// define console.log for IE
window.console = window.console || {};
window.console.log = window.console.log || function() {};

require.config({
  baseUrl: '/',
  paths: {
    angular: 'angular/angular',
    async: 'async/async',
    bedrock: '.',
    bootstrap: 'bootstrap/js/bootstrap',
    iso8601: 'iso8601/iso8601',
    jquery: 'jquery/jquery',
    'jquery.placeholder': 'jquery/jquery.placeholder',
    restangular: 'restangular/restangular',
    spin: 'spin/spin',
    'ui-bootstrap': 'angular-ui/ui-bootstrap-tpls',
    'ui-utils': 'angular-ui/ui-utils',
    'ui-utils-ieshiv': 'angular-ui/ui-utils-ieshiv',
    underscore: 'underscore/underscore',
    // FIXME: port to requireJS
    'bedrock.api': 'legacy/bedrock.api'
  },
  shim: {
    // export globals for non-requireJS libs
    angular: {exports: 'angular', deps: ['jquery']},
    async: {exports: 'async'},
    bootstrap: {deps: ['jquery']},
    jquery: {exports: 'jQuery'},
    'jquery.placeholder': {deps: ['jquery']},
    restangular: {deps: ['angular', 'underscore']},
    spin: {exports: 'Spinner'},
    'ui-bootstrap': {deps: ['angular']},
    'ui-utils': {deps: ['angular', 'ui-utils-ieshiv']},
    underscore: {exports: '_'},
    // FIXME: port to requireJS and remove these
    'bedrock.api': {deps: ['async', 'jquery'], exports: 'bedrock'}
  }
});

require(['app/app'], function() {});

})();
