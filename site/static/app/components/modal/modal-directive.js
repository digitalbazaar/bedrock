/*!
 * Bedrock Modal.
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
    restrict: 'C',
    transclude: true,
    template: '\
        <div data-alerts data-fixed="true"></div> \
        <div ng-transclude></div>'
  };
}

return {modal: factory};

});
