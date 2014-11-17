/*!
 * Form field directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($timeout, brFormLibraryService) {
  return {
    restrict: 'E',
    scope: {
      property: '=brProperty',
      model: '=brModel'
    },
    templateUrl: '/app/components/form/form-field.html',
    link: function(scope, element, attrs) {
      attrs.brOptions = attrs.brOptions || {};
      attrs.$observe('brOptions', function(value) {
        var options = scope.options = scope.$eval(value) || {};
        // TODO: grab vocab via identifier from options
      });

      // FIXME: normalize via framing with @embed=@always
      if(angular.isString(scope.property.property)) {
        // lookup property from id
        scope.propertyId = scope.property.property;
        // FIXME: handle missing schema
        scope.schema = brFormLibraryService.properties[scope.propertyId].value;
      } else {
        // use inline property object
        scope.propertyId = scope.property.property.id;
        scope.schema = scope.property.property;
      }
      scope.range = scope.schema.range;
      scope.value = scope.model;
      scope.key = scope.propertyId;

      // setup target for value storage
      if(scope.propertyId in scope.model) {
        // use value from model
      } else if('value' in scope.property) {
        // use value from property description
        scope.value[scope.key] = angular.copy(scope.property.value);
      } else if('br:default' in scope.schema) {
        // use default from schema description
        scope.value[scope.key] = angular.copy(scope.schema['br:default']);
      } else {
        // use default value
        if(scope.range === 'xsd:dateTime') {
          scope.value[scope.key] = {
            type: 'xsd:dateTime',
            '@value': new Date()
          };
        } else {
          scope.value[scope.key] = null;
        }
      }

      // special dateTime handling
      if(scope.range === 'xsd:dateTime') {
        // handle object with data stored in @value
        if(!angular.isDate(scope.value[scope.key]) &&
          angular.isObject(scope.value[scope.key])) {
          scope.value = scope.value[scope.key];
          scope.key = '@value';
        }

        // ensure date is a date object
        // FIXME: add string model support to datepicker
        if(!angular.isDate(scope.value[scope.key])) {
          scope.value[scope.key] = new Date(scope.value[scope.key]);
        }
      }
    }
  };
}

return {brFormField: factory};

});
