/*!
 * Input directive.
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
        <label ng-if="options.label !== undefined" \
          class="{{options.columns.label}} control-label" \
          for="{{options.name}}">{{options.label}}</label> \
        <div class="{{options.columns.input}}" \
          ng-class="{ \
            \'input-group\': !options.inline, \
            \'input-group-inline\': options.inline}"> \
          <span ng-if="options.icon" \
            class="input-group-addon"><i \
            class="fa {{options.icon}}"></i></span> \
          <span ng-if="options.image" \
            class="input-group-addon"><img \
            ng-src="{{options.image}}"></img></span> \
          <input class="form-control" \
            type="{{options.type}}" \
            name="{{options.name}}" \
            placeholder="{{options.placeholder}}" \
            ng-model="model" \
            ng-disabled="options.disabled" \
            br-track-state="help" \
            ng-class="{\'br-help-off\': options.inline}"/> \
          <span ng-if="options.loading" \
            class="br-spinner-inside-input"> \
            <i class="fa fa-refresh fa-spin text-muted"></i> \
          </span> \
          <span ng-if="!options.inline" class="input-group-btn"> \
            <button type="button" class="btn btn-default" \
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
        options.inline = ('inline' in options) ? options.inline : false;
        options.type = options.type || 'text';
        options.placeholder = options.placeholder || '';

        var columns = options.columns = options.columns || {};
        if(!('label' in columns)) {
          columns.label =  'col-sm-3';
        }
        if(!('input' in columns)) {
          columns.input = 'col-sm-8';
        }
        if(!('help' in columns)) {
          columns.help = 'col-sm-offset-3 col-sm-8';
        }

        if('maxLength' in options) {
          element.find('input').attr('maxlength', options.maxLength);
        } else {
          element.find('input').removeAttr('maxlength');
        }

        if('autocomplete' in options) {
          element.find('input').attr('autocomplete', options.autocomplete);
        } else {
          element.find('input').removeAttr('autocomplete');
        }

        if(options.autofocus) {
          element.find('input').attr('autofocus', 'autofocus');
        } else {
          element.find('input').removeAttr('autofocus');
        }
      });
    }
  };
}

return {brInput: factory};

});
