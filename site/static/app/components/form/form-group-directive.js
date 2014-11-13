/*!
 * Form directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'E',
    scope: {
      model: '=brModel'
    },
    template: '\
      <form class="well form-horizontal"> \
      </form>',
    link: function(scope, element, attrs) {
      attrs.brOptions = attrs.brOptions || {};
      attrs.$observe('brOptions', function(value) {
        var options = scope.options = scope.$eval(value) || {};

        // TODO: build fieldset(s) with options
        // TODO: grab vocab via identifier from options
        // TODO: grab form field "groups" from options
      });
    }
  };
}

return {brForm: factory};

});
