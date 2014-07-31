/*!
 * Action Menu directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'E',
    scope: {},
    transclude: true,
    template: '\
      <div class="btn-group"> \
        <a href="#" class="btn" \
          stackable-trigger="actionMenu" \
          stackable-toggle="\'active\'"> \
          <i class="icon-chevron-down"></i> \
        </a> \
      </div> \
      <stackable-popover stackable="actionMenu" \
        stackable-hide-arrow="true" \
        stackable-placement="bottom" \
        stackable-alignment="right"> \
        <div ng-transclude></div> \
      </stackable-popover>'
  };
}

return {actionMenu: factory};

});
