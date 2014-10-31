/*!
 * Radio Button Group directive.
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
      model: '=brModel',
      group: '=brGroup'
    },
    controller: function() {},
    controllerAs: 'ctrl',
    bindToController: true,
    transclude: true,
    template: '\
      <div class="form-group" br-property-path="{{ctrl.options.name}}"> \
        <label ng-if="ctrl.options.label !== undefined" \
          class="{{ctrl.options.columns.label}} control-label" \
          for="{{ctrl.options.name}}" \
          br-track-state="ctrl.help" \
          ng-click="ctrl.help.help.pressed=!ctrl.help.help.pressed; \
            ctrl.help.show=!ctrl.help.show"> \
          <a ng-if="ctrl.options.help" br-help-toggle="ctrl.help"><i \
            class="fa fa-question-circle"></i></a> \
            <span ng-bind-html="ctrl.options.label"></span> \
        </label> \
        <div ng-if="!ctrl.options.inline" \
          class="{{ctrl.options.columns.group}}"> \
          <div class="radio" ng-repeat="item in ctrl.group" \
            ng-class="{disabled: item.disabled}"> \
            <label> \
              <input type="radio" name="{{ctrl.options.name}}" \
                ng-value="item.value" ng-model="ctrl.model" /> \
                <i ng-if="item.icon" class="fa fa-{{item.icon}}"></i> \
                <span ng-bind-html="item.label"></span> \
            </label> \
          </div> \
        </div> \
        <label ng-if="ctrl.options.inline" class="radio-inline" \
          ng-repeat="item in ctrl.group"> \
          <input type="radio" name="{{ctrl.options.name}}" \
            ng-value="item.value" ng-model="ctrl.model" /> \
          <span ng-bind-html="item.label"></span> \
        </label> \
        <div ng-if="ctrl.options.help" class="row"> \
          <div ng-show="ctrl.help.show" \
            class="{{ctrl.options.columns.help}} \
              help-block br-fadein br-fadeout"> \
            <div ng-transclude></div> \
          </div> \
        </div> \
      </div>',
    link: function(scope, element, attrs, ctrl) {
      attrs.$observe('brOptions', function(value) {
        var options = ctrl.options = value ? scope.$eval(value) || {} : {};
        options.inline = ('inline' in options) ? options.inline : false;
        options.help = ('help' in options) ? options.help : true;

        var columns = options.columns = options.columns || {};
        if(!('label' in columns)) {
          columns.label =  'col-sm-3';
        }
        if(!('group' in columns)) {
          columns.group = 'col-sm-8';
        }
        if(!('help' in columns)) {
          columns.help = 'col-sm-offset-3 col-sm-8';
        }
      });
    }
  };
}

return {brRadioGroup: factory};

});
