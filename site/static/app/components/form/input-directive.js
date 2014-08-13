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
      <div class="form-group" data-binding="{{options.name}}"> \
        <label class="{{options.columns.label}} control-label" \
          for="{{options.name}}">{{options.label}}</label> \
        <div class="{{options.columns.input}} input-group"> \
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
            data-track-state="help" /> \
          <span class="input-group-btn"> \
            <button type="button" class="btn btn-default" \
              data-help-toggle="help"> \
              <i class="fa fa-question-circle"></i> \
            </button> \
          </span> \
        </div> \
        <div ng-show="help.show" \
          class="{{options.columns.help}} help-block br-fadein br-fadeout"> \
          <div ng-transclude></div> \
        </div> \
      </div>',
    link: function(scope, element, attrs) {
      scope.$watch(attrs.brOptions, function(options) {
        scope.options = options || {};
        scope.options.type = scope.options.type || 'text';
        scope.options.placeholder = scope.options.placeholder || '';

        var columns = scope.options.columns = scope.options.columns || {};
        columns.label = columns.label || 'col-sm-3';
        columns.input = columns.input || 'col-sm-8';
        columns.help = columns.help || 'col-sm-offset-3 col-sm-8';

        if(scope.options.disabled) {
          element.find('input').attr('disabled', '');
        } else {
          element.find('input').removeAttr('disabled');
        }

        if('maxLength' in scope.options) {
          element.find('input').attr('maxlength', scope.options.maxLength);
        } else {
          element.find('input').removeAttr('maxlength');
        }

        if('autocomplete' in scope.options) {
          element.find('input').attr('autocomplete', scope.options.autocomplete);
        } else {
          element.find('input').removeAttr('autocomplete');
        }
      }, true);
    }
  };
}

return {brInput: factory};

});
