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
      groups: '=brGroups',
      model: '=brModel'
    },
    template: '\
      <div br-lazy-compile="options" br-lazy-compile-id="br-form"> \
        <form ng-if="options.editable && !options.embedded" \
          class="form-horizontal"> \
          <div ng-repeat="group in groups" \
            ng-switch="group.type"> \
            <br-form-group ng-switch-when="PropertyGroup" \
              br-model="model" br-group="group" br-options="{{options}}" /> \
            <div ng-switch-default> \
              <p class="text-warning">Unknown group.</p> \
              <pre>{{group|json}}</pre> \
            </div> \
          </div> \
        </form> \
        <div ng-if="options.editable && options.embedded"> \
          <div ng-repeat="group in groups" \
            ng-switch="group.type"> \
            <br-form-group ng-switch-when="PropertyGroup" \
              br-model="model" br-group="group" br-options="{{options}}" /> \
            <div ng-switch-default> \
              <p class="text-warning">Unknown group.</p> \
              <pre>{{group|json}}</pre> \
            </div> \
          </div> \
        </div> \
        <div ng-if="!options.editable" \
          ng-repeat="group in groups" \
          ng-switch="group.type"> \
          <br-form-group ng-switch-when="PropertyGroup" \
            br-model="model" br-group="group" br-options="{{options}}" /> \
          <div ng-switch-default> \
            <p class="text-warning">Unknown group.</p> \
            <pre>{{group|json}}</pre> \
          </div> \
        </div> \
        <!-- \
        <pre>FORM OPTIONS: {{options|json}}</pre> \
        <pre>FORM GROUPS: {{groups|json}}</pre> \
        <pre>FORM MODEL: {{model|json}}</pre> \
        --> \
      </div>',
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
