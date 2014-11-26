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
function factory() {
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
        scope.options = scope.$eval(value) || {};
      });

      scope.propertyId = scope.property.property.id;
      scope.schema = scope.property.property;
      scope.range = scope.schema.range;
      scope.value = scope.model;
      scope.key = scope.propertyId;

      // build range options, if given
      if(scope.property.rangeOption) {
        scope.rangeOptions = [];
        for(var i = 0; i < scope.property.rangeOption.length; ++i) {
          var opt = scope.property.rangeOption[i];
          var option = {};
          scope.rangeOptions.push(option);

          // identify option by id or type
          if(opt.rangeOptionId) {
            option.id = opt.rangeOptionId;
          } else if(opt.rangeOptionType) {
            option.id = opt.rangeOptionType;
          }

          if('label' in opt) {
            option.label = opt.label;
          } else {
            option.label = option.id;
          }

          // shallow copy property groups/dereference them
          if(opt.propertyGroup) {
            option.propertyGroup = [];
            for(var pi = 0; pi < opt.propertyGroup.length; ++pi) {
              // TODO: populate property groups if not embedded due to
              // circular reference (requires access to library, so
              // a br-library option will have to be propagated from
              // br-form through br-form-field)
              var group = opt.propertyGroup[i];
              if(angular.isString(group)) {
                option.propertyGroup.push(scope.library.groups[group]);
              } else {
                option.propertyGroup.push(group);
              }
            }
          }
        }
      }

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
        if(scope.range === 'Date') {
          scope.value[scope.key] = {
            type: 'xsd:dateTime',
            '@value': new Date()
          };
        } else {
          scope.value[scope.key] = null;
        }
      }

      // special dateTime handling
      if(scope.range === 'Date') {
        // FIXME: due to compaction w/bedrock form context, data should always
        // be in expanded form and stored in @value, so remove this conditional
        if(!angular.isDate(scope.value[scope.key]) &&
          angular.isObject(scope.value[scope.key])) {
          scope.value = scope.value[scope.key];
          scope.key = '@value';
        }

        // ensure date is a date object
        // FIXME: add string model support to datepicker and remove conditional
        // below
        if(!angular.isDate(scope.value[scope.key])) {
          scope.value[scope.key] = new Date(scope.value[scope.key]);
        }
      }
    }
  };
}

return {brFormField: factory};

});
