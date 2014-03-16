/*!
 * Tooltip Title directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var deps = [];
return {tooltipTitle: deps.concat(factory)};

function factory() {
  return function(scope, element, attrs) {
    var show = false;
    attrs.$observe('tooltipTitle', function(value) {
      if(element.data('tooltip')) {
        element.tooltip('hide');
        element.removeData('tooltip');
      }
      var container = element.closest('.modal-body');
      if(!container.length) {
        container = 'body';
      }
      element.tooltip({
        title: value,
        container: container
      });
      if(show) {
        element.data('tooltip').show();
      }
    });
    attrs.$observe('tooltipShow', function(value) {
      if(value !== undefined) {
        var tooltip = element.data('tooltip');
        if(value === 'true') {
          show = true;
          if(tooltip) {
            tooltip.show();
          }
        }
        else {
          show = false;
          if(tooltip) {
            tooltip.hide();
          }
        }
      }
    });
  };
}

});
