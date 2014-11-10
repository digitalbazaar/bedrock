/*!
 * Headline directive.
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
      title: '@brTitle',
      loading: '=?brLoading'
    },
    transclude: true,
    template: '\
      <h3 class="headline"> \
        {{title}} \
        <span ng-hide="!options.menu || loading" \
          class="btn-group pull-right"> \
          <button type="button" \
            class="btn btn-default btn-sm" \
            stackable-trigger="menu" \
            stackable-toggle="\'active\'"> \
            <i class="fa fa-bars"></i> \
          </button> \
        </span> \
        <span ng-show="loading" class="pull-right"> \
          <i class="fa fa-refresh fa-spin text-muted"></i> \
        </span> \
      </h3> \
      <stackable-popover stackable="menu" \
        stackable-hide-arrow="true" \
        stackable-placement="bottom" \
        stackable-alignment="right" \
        br-lazy-compile="menu.show" br-lazy-id="br-headline"> \
        <div ng-transclude></div> \
      </stackable-popover>',
    link: function(scope, element, attrs) {
      attrs.brOptions = attrs.brOptions || {};
      attrs.$observe('brOptions', function(value) {
        scope.options = scope.$eval(value) || {};
        if(!('menu' in scope.options)) {
          scope.options.menu = true;
        }
      });
    }
  };
}

return {brHeadline: factory};

});
