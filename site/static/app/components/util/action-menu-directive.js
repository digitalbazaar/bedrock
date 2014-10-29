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
        <button type="button" class="btn btn-default btn-sm" \
          stackable-trigger="menu" \
          stackable-toggle="\'active\'"> \
          <i class="fa fa-chevron-down"></i> \
        </button> \
      </div> \
      <stackable-popover stackable="menu" \
        stackable-hide-arrow="true" \
        stackable-placement="bottom" \
        stackable-alignment="right" \
        br-lazy-compile="menu.show" br-lazy-id="br-action-menu"> \
        <div ng-transclude></div> \
      </stackable-popover>'
  };
}

return {brActionMenu: factory};

});
