/*!
 * Headline Menu directive.
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
    scope: {
      headline: '@',
      loading: '=?'
    },
    transclude: true,
    template: '\
      <h3 class="headline"> \
        {{headline}} \
        <span ng-hide="loading" class="btn-group pull-right"> \
          <a class="btn" \
            stackable-trigger="menu" \
            stackable-toggle="\'active\'"> \
            <i class="icon-reorder"></i> \
          </a> \
        </span> \
        <span ng-show="loading" class="pull-right"> \
          <span data-spinner="loading" data-spinner-class="h3-spinner"></span> \
        </span> \
      </h3> \
      <stackable-popover stackable="menu" \
        stackable-hide-arrow="true" \
        stackable-placement="bottom" \
        stackable-alignment="right"> \
        <div ng-transclude></div> \
      </stackable-popover>'
  };
}

return {headlineMenu: factory};

});
