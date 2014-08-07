/*!
 * Add Alert directive. Allows for adding an html-based alert to the
 * AlertService via transclusion.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(AlertService) {
  return {
    restrict: 'EA',
    compile: function(tElement) {
      var template = tElement.html();
      return function(scope, element, attrs) {
        element.remove();
        attrs.$observe('alertType', function(alertType) {
          if(alertType) {
            AlertService.add(alertType, {html: template}, {scope: scope});
          }
        });
      };
    }
  };
}

return {addAlert: factory};

});
