/*!
 * Fade Toggle directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    link: function(scope, element, attrs) {
      // init to hidden
      element.addClass('hide');
      scope.$watch(attrs.fadeToggle, function(value) {
        if(value) {
          if(element.is(':animated')) {
            element.stop(true, true).show();
          } else {
            element.fadeIn();
          }
        } else {
          if(element.is(':animated')) {
            element.stop(true, true).hide();
          } else {
            element.fadeOut();
          }
        }
      });
    }
  };
}

return {fadeToggle: factory};

});
