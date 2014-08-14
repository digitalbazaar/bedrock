/*!
 * Country selector directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(config) {
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
          <ui-select ng-model="country.selected" data-track-state="help" \
            theme="bootstrap" ng-disabled="options.disabled"> \
            <ui-select-match placeholder="{{options.placeholder}}">{{$select.selected.name}}</ui-select-match> \
            <ui-select-choices repeat="c in countries | filter: $select.search"> \
              <div ng-bind-html="c.name | highlight: $select.search"></div> \
            </ui-select-choices> \
          </ui-select> \
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
    link: Link
  };

  function Link(scope, element, attrs) {
    scope.countries = config.constants.countries;
    var country = scope.country = {selected: undefined};
    var options = scope.options = {};

    scope.$watch(attrs.brOptions, function(value) {
      options = scope.options = value || {};
      options.label = options.label || 'Country';
      options.placeholder = options.placeholder || 'Pick a country...';

      var columns = options.columns = options.columns || {};
      columns.label = columns.label || 'col-sm-3';
      columns.input = columns.input || 'col-sm-8';
      columns.help = columns.help || 'col-sm-offset-3 col-sm-8';
    }, true);

    // when external model changes, update selection
    scope.$watch('model', function(value) {
      if(!value) {
        country.selected = undefined;
        return;
      }

      if(options.mode === 'code' || typeof value === 'string') {
        // find country with matching country code
        for(var i = 0; i < scope.countries.length; ++i) {
          if(scope.countries[i].code === value) {
            country.selected = scope.countries[i];
            return;
          }
        }
        return;
      }

      // by default no difference between ngModel model value and view value,
      // update model.country to render it
      country.selected = value;
    }, true);

    // when country selection changes, update external model
    scope.$watch('country.selected', function(country) {
      if(!country) {
        scope.model = undefined;
        return;
      }

      if(options.mode === 'code' || typeof scope.model === 'string') {
        scope.model = country.code;
        return;
      }

      // default mode uses full country object
      scope.model = country;
    }, true);
  }
}

return {brCountrySelector: factory};

});
