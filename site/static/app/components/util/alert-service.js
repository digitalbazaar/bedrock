/*!
 * Alert Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($rootScope, ModelService) {
  var service = {};

  // defined categories
  service.category = {
    FEEDBACK: 'FEEDBACK',
    BACKGROUND: 'BACKGROUND'
  };

  // categorized log of alerts
  service.log = {};
  angular.forEach(service.category, function(c) {
    service.log[c] = [];
  });

  // the total number of alerts
  service.total = 0;

  /**
   * Adds an alert to the log.
   *
   * @param type the type of alert ('error', 'warning', 'info').
   * @param value the alert to add.
   * @param options the options to use:
   *          [category] an optional category for the alert,
   *            default: service.category.FEEDBACK.
   *          [scope] a scope to attach a listener to destroy the alert
   *            when the scope is destroyed.
   */
  service.add = function(type, value, options) {
    if(typeof value === 'string') {
      value = {message: value};
    }
    if(type === 'error' &&
      'stack' in value &&
      typeof console !== 'undefined') {
      var log = ('error' in console) ? console.error : console.log;
      log.call(console, 'Error value:', value);
      log.call(console, 'Error stack:', value.stack);
    }
    var options = options || {};
    var category = options.category || service.category.FEEDBACK;
    var scope = options.scope || null;
    var info = {type: type, value: value};
    // remove alert when scope is destroyed
    if(scope) {
      scope.$on('$destroy', function() {
        service.remove(type, value);
      });
    }
    service.log[category].push(info);
    service.total += 1;
  };

  /**
   * Removes the given alert, regardless of which category it is in.
   *
   * @param type the alert type.
   * @param value the alert to remove.
   */
  service.remove = function(type, value) {
    angular.forEach(service.log, function(list) {
      for(var i = 0; i < list.length; ++i) {
        if(list[i].type === type && list[i].value === value) {
          list.splice(i, 1);
          service.total -= 1;
          break;
        }
      }
    });
  };

  /**
   * Clears all alerts of a given type or all alerts of a given type in a
   * particular category.
   *
   * @param [type] the alert type, null for all..
   * @param [category] the category to clear, omit for all.
   */
  service.clear = function(type, category) {
    if(category) {
      if(!(category in service.category)) {
        throw new Error('Invalid error category: ' + category);
      }
      service.total -= service.log[category].length;
      service.log[category].length = 0;
      return;
    }

    // clear all categories
    angular.forEach(service.log, function(list) {
      if(!type) {
        service.total -= list.length;
        list.length = 0;
        return;
      }
      ModelService.removeAllFromArray(list, function(e) {
        if(e.type === type) {
          service.total -= 1;
          return true;
        }
        return false;
      });
    });
  };

  /**
   * Clears all feedback alerts.
   *
   * @param [type] the alert type.
   */
  service.clearFeedback = function(type) {
    if(type) {
      service.clear(type, service.category.FEEDBACK);
    } else {
      service.clear(null, service.category.FEEDBACK);
    }
  };

  // expose service to scope
  $rootScope.app.services.alert = service;

  return service;
}

return {AlertService: factory};

});
