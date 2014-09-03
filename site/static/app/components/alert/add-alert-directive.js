/*!
 * Add Alert directive. Allows for adding an html-based alert to the
 * brAlertService via transclusion.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory(brAlertService) {
  return {
    restrict: 'EA',
    compile: function(tElement) {
      var template = tElement.html();
      return function(scope, element, attrs) {
        element.remove();
        attrs.$observe('brAlertType', function(alertType) {
          if(alertType) {
            brAlertService.add(alertType, {html: template}, {scope: scope});
          }
        });
      };
    }
  };
}

return {brAddAlert: factory};

});
