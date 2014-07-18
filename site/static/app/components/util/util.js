/*!
 * Utility module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './alert-service',
  './alerts-directive',
  './animate-directive',
  './ceil-filter',
  './country-selector-directive',
  './ellipsis-filter',
  './embedded-string-filter',
  './encodeuricomponent-filter',
  './error-directive',
  './floor-filter',
  './focus-toggle-directive',
  './help-toggle-directive',
  './input-watcher-directive',
  './mask-filter',
  './model-service',
  './mouseover-toggle-directive',
  './now-filter',
  './prefill-filter',
  './refresh-service',
  './resource-service',
  './template-cache-service',
  './tooltip-title-directive',
  './track-state-directive'
], function(
  angular,
  alertService,
  alerts,
  animate,
  ceil,
  countrySelector,
  ellipsis,
  embeddedString,
  encodeURIComponent_,
  error,
  floor,
  focusToggle,
  helpToggle,
  inputWatcher,
  mask,
  modelService,
  mouseoverToggle,
  now,
  prefill,
  refreshService,
  resourceService,
  templateCacheService,
  tooltipTitle,
  trackState) {

'use strict';

var module = angular.module('app.util', []);

module.service(alertService);
module.directive(alerts);
module.directive(animate);
module.filter(ceil);
module.directive(countrySelector);
module.filter(ellipsis);
module.filter(embeddedString);
module.filter(encodeURIComponent_);
module.directive(error);
module.filter(floor);
module.directive(focusToggle);
module.directive(helpToggle);
module.directive(inputWatcher);
module.filter(mask);
module.service(modelService);
module.directive(mouseoverToggle);
module.filter(now);
module.filter(prefill);
module.service(refreshService);
module.service(resourceService);
module.service(templateCacheService);
module.directive(tooltipTitle);
module.directive(trackState);

return module.name;

});
