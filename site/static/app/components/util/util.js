/*!
 * Utility module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './action-menu-directive',
  './ceil-filter',
  './ellipsis-filter',
  './embedded-string-filter',
  './encodeuricomponent-filter',
  './error-directive',
  './floor-filter',
  './headline-menu-directive',
  './mask-filter',
  './model-service',
  './now-filter',
  './prefill-filter',
  './refresh-service',
  './resource-service',
  './tooltip-directive',
  './tooltip-title-directive'
], function(
  angular,
  actionMenuDirective,
  ceil,
  ellipsis,
  embeddedString,
  encodeURIComponent_,
  error,
  floor,
  headlineMenuDirective,
  mask,
  modelService,
  now,
  prefill,
  refreshService,
  resourceService,
  tooltipDirective,
  tooltipTitle) {

'use strict';

var module = angular.module('app.util', []);

module.directive(actionMenuDirective);
module.filter(ceil);
module.filter(ellipsis);
module.filter(embeddedString);
module.filter(encodeURIComponent_);
module.directive(error);
module.filter(floor);
module.directive(headlineMenuDirective);
module.filter(mask);
module.service(modelService);
module.filter(now);
module.filter(prefill);
module.service(refreshService);
module.service(resourceService);
module.directive(tooltipDirective);
module.directive(tooltipTitle);

return module.name;

});
