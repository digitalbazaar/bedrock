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
    controller: function() {},
    controllerAs: 'ctrl',
    bindToController: true,
    templateUrl: '/app/components/form/form-field.html',
    link: function(scope, element, attrs, ctrl) {
      attrs.brOptions = attrs.brOptions || {};
      attrs.$observe('brOptions', function(value) {
        ctrl.options = scope.$eval(value) || {};
      });

      ctrl.propertyId = ctrl.property.property.id;
      ctrl.schema = ctrl.property.property;
      ctrl.range = ctrl.schema.range;
      ctrl.value = ctrl.model;
      ctrl.key = ctrl.propertyId;
      ctrl.rangeOptions = [];
      ctrl.selected = null;

      if(ctrl.property.rangeOption) {
        // build range options
        for(var i = 0; i < ctrl.property.rangeOption.length; ++i) {
          var opt = ctrl.property.rangeOption[i];
          var option = {
            label: opt.label,
            value: angular.copy(opt.value)
          };
          if(angular.isObject(option.value) && 'id' in option.value &&
            option.value.id.indexOf('_:') === 0) {
            // remove blank node ID from value to avoid conflicts with
            // the model's blank nodes
            delete option.value.id;
          }
          if(opt.propertyGroup) {
            option.propertyGroup = opt.propertyGroup;
          }
          ctrl.rangeOptions.push(option);
        }

        if(ctrl.property.rangeOptionCompareProperty) {
          // compare two range options for equality based on the given property
          ctrl.compare = function(item1, item2) {
            if(!angular.isObject(item1) || !angular.isObject(item2)) {
              return (item1 === item2);
            }
            return (item1[ctrl.property.rangeOptionCompareProperty] ===
              item2[ctrl.property.rangeOptionCompareProperty]);
          };
        } else {
          // compare two range options based on simple equality
          ctrl.compare = function(item1, item2) {
            return item1 === item2;
          };
        }

        // two-bind selected.value with ctrl.value[ctrl.key]
        scope.$watch(function() {
          return ctrl.selected;
        }, function(selected) {
          if(selected) {
            ctrl.value[ctrl.key] = selected.value;
          }
        });
        scope.$watch(function() {
          return ctrl.value[ctrl.key];
        }, function(value) {
          if(value === undefined) {
            initValue();
            return;
          }

          // update selection to matching range option
          for(var i = 0; i < ctrl.rangeOptions.length; ++i) {
            var option = ctrl.rangeOptions[i];
            if(ctrl.compare(option.value, value)) {
              ctrl.selected = option;
              ctrl.selected.value = value;
            }
          }
        });
      }

      function initValue() {
        if(!ctrl.property.optional && ctrl.rangeOptions.length === 1) {
          // auto-select only option
          ctrl.selected = ctrl.rangeOptions[0];
          ctrl.value[ctrl.key] = ctrl.selected.value;
          return;
        }

        if('value' in ctrl.property) {
          // use value from property description
          ctrl.value[ctrl.key] = angular.copy(ctrl.property.value);
        } else if('br:default' in ctrl.schema) {
          // use default from schema description
          ctrl.value[ctrl.key] = angular.copy(ctrl.schema['br:default']);
        } else {
          // use default value
          if(ctrl.range === 'Date') {
            ctrl.value[ctrl.key] = {
              type: 'xsd:dateTime',
              '@value': new Date()
            };
          } else {
            ctrl.value[ctrl.key] = null;
          }
        }
      }
    }
  };
}

return {brFormField: factory};

});
