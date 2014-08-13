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
      <div class="form-group" data-binding="{{options.name}}"> \
        <label class="{{options.columns.label}} control-label" \
          for="{{options.name}}">{{options.label}}</label> \
        <div class="{{options.columns.input}} input-group"> \
          <span ng-if="options.icon" \
            class="input-group-addon"><i \
            class="fa {{options.icon}}"></i></span> \
          <textarea class="form-control" \
            rows="{{options.rows}}" \
            name="{{options.name}}" \
            placeholder="{{options.placeholder}}" \
            ng-model="model" \
            data-track-state="help" /> \
          <span class="input-group-btn"> \
            <button type="button" class="btn btn-default btn-xs" \
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
        scope.options.placeholder = (scope.options.placeholder ||
          scope.options.label);
        scope.options.rows = scope.options.rows || '5';

        var columns = scope.options.columns = scope.options.columns || {};
        columns.label = columns.label || 'col-sm-3';
        columns.textarea = columns.textarea || 'col-sm-8';
        columns.help = columns.help || 'col-sm-offset-3 col-sm-8';

        if(scope.options.disabled) {
          element.find('textarea').attr('disabled', '');
        } else {
          element.find('textarea').removeAttr('disabled');
        }
      }, true);
    }
  };
}

return {brTextarea: factory};

});
