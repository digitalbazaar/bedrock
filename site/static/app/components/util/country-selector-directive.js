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
      <select ui-select2 data-ng-model="model.selected" \
        data-placeholder="Pick a country..."> \
        <option value=""></option> \
        <option data-ng-repeat="country in model.countries" \
          value="{{country.code}}" \
          data-ng-selected="model.selected == country.code"> \
          {{country.name}}</option> \
      </select> \
      </div>'
  };

  function Link(scope, element, attrs, ngModel) {
    var model = scope.model = {};
    model.selected = null;
    model.countries = config.constants.countries;
    // no difference between ngModel model value and view value, set
    // to model.selected when rendering the value
    ngModel.$render = function() {
      model.selected = ngModel.$viewValue;
    };
    // when model.selected changes, update ngModel view (same as model value)
    scope.$watch(function() {
      return model.selected;
    }, function(value) {
      ngModel.$setViewValue(value);
    });
  }
}

return {countrySelector: factory};

});
