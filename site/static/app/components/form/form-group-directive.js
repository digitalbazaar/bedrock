/*!
 * Form group directive.
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
      group: '=brGroup',
      model: '=brModel'
    },
    template: '\
      <div class="section"> \
        <h4 class="headline">{{group.label}}</h4> \
        <p class="text-info" ng-show="group.comment">{{group.comment}}</p> \
        <p ng-show="group.layout.length == 0" class="text-center"> \
          No fields. \
        </p> \
        <div ng-if="options.editable" ng-show="group.layout.length > 0" class="well"> \
          <fieldset> \
            <br-form-field ng-repeat="property in group.layout" \
              br-property="property" br-model="model" br-options="options" /> \
          </fieldset> \
        </div> \
        <dl ng-if="!options.editable" ng-show="group.layout.length > 0" class="dl-horizontal"> \
          <br-form-field ng-repeat="property in group.layout" \
            br-property="property" br-model="model" br-options="options" /> \
        </dl> \
      </div>',
    link: function(scope, element, attrs) {
      attrs.brOptions = attrs.brOptions || {};
      attrs.$observe('brOptions', function(value) {
        var options = scope.options = scope.$eval(value) || {};
        // TODO: grab vocab via identifier from options
        // TODO: use repeater in template to pass options to br-form-field(s)
      });
    }
  };
}

return {brFormGroup: factory};

});
