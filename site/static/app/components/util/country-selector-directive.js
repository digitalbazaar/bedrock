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
    scope: {},
    replace: true,
    require: 'ngModel',
    link: Link,
    template: '\
      <div> \
      <ui-select ng-model="model.country" theme="bootstrap"> \
        <ui-select-match placeholder="Pick a country...">{{$select.selected.name}}</ui-select-match> \
        <ui-select-choices repeat="country in model.countries | filter: $select.search"> \
          <div ng-bind-html="country.name | highlight: $select.search"></div> \
        </ui-select-choices> \
      </ui-select> \
      </div>'
  };

  function Link(scope, element, attrs, ngModel) {
    var model = scope.model = {};
    model.countries = config.constants.countries;

    var options = {};
    scope.$watch(attrs.brOptions, function(value) {
      if(value) {
        options = value;
      }
    }, true);

    // when rendering view value (country code), find the associated country
    ngModel.$render = function() {
      if(!ngModel.$viewValue) {
        model.country = undefined;
        return;
      }

      if(options.mode === 'code' || typeof ngModel.$viewValue === 'string') {
        // find country with matching country code
        for(var i = 0; i < model.countries.length; ++i) {
          if(model.countries[i].code === ngModel.$viewValue) {
            model.country = model.countries[i];
            return;
          }
        }
        return;
      }

      // by default no difference between ngModel model value and view value,
      // update model.country to render it
      model.country = ngModel.$viewValue;
    };

    // when country selection changes, update ngModel view
    scope.$watch(function() {
      return model.country;
    }, function(country) {
      if(!country) {
        ngModel.$setViewValue(undefined);
        return;
      }

      if(options.mode === 'code' || typeof ngModel.$viewValue === 'string') {
        ngModel.$setViewValue(country.code);
        return;
      }

      // default mode uses full country object
      ngModel.$setViewValue(country);
    }, true);
  }
}

return {brCountrySelector: factory};

});
