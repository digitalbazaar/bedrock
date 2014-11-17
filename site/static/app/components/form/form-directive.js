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
      library: '=brLibrary',
      groups: '=brGroups',
      model: '=brModel'
    },
    template: '\
      <form class="form-horizontal"> \
        <div ng-repeat="group in groups" ng-switch="library[group].type"> \
          <br-form-group ng-switch-when="PropertyGroup" \
            br-model="model" br-group="library[group]" /> \
          <div ng-switch-default> \
            <p class="text-warning">Unknown group.</p> \
            <pre>{{group|json}}</pre> \
          </div> \
        </div> \
        <pre>LIBRARY: {{library|json}}</pre> \
        <pre>MODEL: {{model|json}}</pre> \
      </form>',
    link: function(scope, element, attrs) {
      attrs.brOptions = attrs.brOptions || {};
      attrs.$observe('brOptions', function(value) {
        var options = scope.options = scope.$eval(value) || {};
        // TODO: grab vocab via identifier from options
        // TODO: pass options to br-form-groups via repeater in template
      });
    }
  };
}

return {brForm: factory};

});
