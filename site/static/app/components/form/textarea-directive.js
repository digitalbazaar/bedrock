/*!
 * Textarea directive.
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
    transclude: true,
    template: '\
      <div ng-class="{\'form-group\': !options.inline}" \
        br-property-path="{{options.name}}"> \
        <label ng-if="!options.inline && options.label !== undefined" \
          class="{{options.columns.label}} control-label" \
          for="{{options.name}}">{{options.label}}</label> \
        <div class="{{options.columns.textarea}}" \
          ng-class="{ \
            \'input-group\': !options.inline, \
            \'input-group-inline\': options.inline}"> \
          <span ng-if="options.icon" \
            class="input-group-addon"><i \
            class="fa {{options.icon}}"></i></span> \
          <span ng-if="options.image" \
            class="input-group-addon"><img \
            ng-src="{{options.image}}"></img></span> \
          <textarea class="form-control" \
            rows="{{options.rows}}" \
            name="{{options.name}}" \
            placeholder="{{options.placeholder}}" \
            ng-model="model" ng-disabled=options.disabled \
            br-track-state="help" \
            ng-class="{\'br-help-off\': options.inline}"/> \
          <span ng-if="!options.inline" class="input-group-btn"> \
            <button type="button" class="btn btn-default btn-xs" \
              br-help-toggle="help"> \
              <i class="fa fa-question-circle"></i> \
            </button> \
          </span> \
        </div> \
        <div ng-if="!options.inline" ng-show="help.show" \
          class="{{options.columns.help}} help-block br-fadein br-fadeout"> \
          <div ng-transclude></div> \
        </div> \
      </div>',
    link: function(scope, element, attrs) {
      attrs.$observe('brOptions', function(value) {
        var options = scope.options = value ? scope.$eval(value) || {} : {};
        options.placeholder = options.placeholder || options.label;
        options.rows = options.rows || '5';

        var columns = options.columns = options.columns || {};
        columns.label = columns.label || 'col-sm-3';
        columns.textarea = columns.textarea || 'col-sm-8';
        columns.help = columns.help || 'col-sm-offset-3 col-sm-8';

        if(options.autofocus) {
          element.find('textarea').attr('autofocus', 'autofocus');
        } else {
          element.find('textarea').removeAttr('autofocus');
        }
      });
    }
  };
}

return {brTextarea: factory};

});
