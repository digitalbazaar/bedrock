/*!
 * Utility module.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([
  'angular',
  './alert.service',
  './alerts.directive',
  './animate.directive',
  './ceil.filter',
  './ellipsis.filter',
  './embeddedString.filter',
  './encodeURIComponent.filter',
  './error.directive',
  './floor.filter',
  './focusToggle.directive',
  './helpToggle.directive',
  './inputWatcher.directive',
  './mask.filter',
  './model.service',
  './mouseoverToggle.directive',
  './now.filter',
  './prefill.filter',
  './resource.service',
  './templateCache.service',
  './tooltipTitle.directive',
  './trackState.directive'
], function(
  angular, alertService, alerts, animate, ceil, ellipsis, embeddedString,
  encodeURIComponent_, error, floor, focusToggle, helpToggle,
  inputWatcher, mask, model, mouseoverToggle, now, prefill, resource,
  templateCache, tooltipTitle, trackState) {

'use strict';

var module = angular.module('app.util', []);

module.directive(alerts);
module.directive(animate);
module.directive(error);
module.directive(focusToggle);
module.directive(helpToggle);
module.directive(inputWatcher);
module.directive(mouseoverToggle);
module.directive(tooltipTitle);
module.directive(trackState);

module.filter(ceil);
module.filter(ellipsis);
module.filter(embeddedString);
module.filter(encodeURIComponent_);
module.filter(floor);
module.filter(mask);
module.filter(now);
module.filter(prefill);

module.service(alertService);
module.service(model);
module.service(resource);
module.service(templateCache);

});
