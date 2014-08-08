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
  './country-selector-directive',
  './ellipsis-filter',
  './embedded-string-filter',
  './encodeuricomponent-filter',
  './error-directive',
  './floor-filter',
  './headline-menu',
  './help-toggle-directive',
  './input-watcher-directive',
  './mask-filter',
  './model-service',
  './now-filter',
  './prefill-filter',
  './refresh-service',
  './resource-service',
  './tooltip-title-directive',
  './track-state-directive'
], function(
  angular,
  actionMenu,
  ceil,
  countrySelector,
  ellipsis,
  embeddedString,
  encodeURIComponent_,
  error,
  floor,
  headlineMenu,
  helpToggle,
  inputWatcher,
  mask,
  modelService,
  now,
  prefill,
  refreshService,
  resourceService,
  tooltipTitle,
  trackState) {

'use strict';

var module = angular.module('app.util', []);

module.directive(actionMenu);
module.filter(ceil);
module.directive(countrySelector);
module.filter(ellipsis);
module.filter(embeddedString);
module.filter(encodeURIComponent_);
module.directive(error);
module.filter(floor);
module.directive(headlineMenu);
module.directive(helpToggle);
module.directive(inputWatcher);
module.filter(mask);
module.service(modelService);
module.filter(now);
module.filter(prefill);
module.service(refreshService);
module.service(resourceService);
module.directive(tooltipTitle);
module.directive(trackState);

return module.name;

});
