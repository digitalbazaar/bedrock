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

  // valid event types
  var eventTypes = ['add', 'remove', 'clear'];

  // alert listeners
  service.listeners = {};
  eventTypes.forEach(function(event) {
    service.listeners[event] = [];
  });

  /**
   * Adds a listener.
   *
   * @param event the type of event to listen for.
   * @param listener the listener to add.
   *
   * @return the service for chaining.
   */
  service.on = function(event, listener) {
    if(eventTypes.indexOf(event) === -1) {
      throw new Error('Unknown event type "' + event + '"');
    }
    service.listeners[event].push(listener);
    return service;
  };

  /**
   * Removes an event listener.
   *
   * @param event the event type.
   * @param listener the listener to remove.
   *
   * @return the service for chaining.
   */
  service.removeListener = function(event, listener) {
    if(eventTypes.indexOf(event) === -1) {
      throw new Error('Unknown event type "' + event + '"');
    }
    var listeners = service.listeners[event];
    var idx = listeners.indexOf(listener);
    if(idx !== -1) {
      listeners.splice(idx, 1);
    }
    return service;
  };

  /**
   * Emits an event to all listeners.
   *
   * @param event the event to emit.
   * @param data any data associated with the event.
   */
  var emit = function(event, data) {
    var listeners = service.listeners[event];
    listeners.forEach(function(listener) {
      listener(data);
    });
  };

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
   *
   * @return the service for chaining.
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
    options = options || {};
    var category = options.category || service.category.FEEDBACK;
    var scope = options.scope || null;
    var info = {type: type, value: value, category: category};
    // remove alert when scope is destroyed
    if(scope) {
      // provide access to scope
      value.getScope = function() {
        return scope;
      };
      scope.$on('$destroy', function() {
        service.remove(type, value);
        $rootScope.$apply();
      });
    }
    service.log[category].push(info);
    service.total += 1;
    emit('add', info);
    return service;
  };

  /**
   * Removes the given alert, regardless of which category it is in.
   *
   * @param type the alert type.
   * @param value the alert to remove.
   *
   * @return the service for chaining.
   */
  service.remove = function(type, value) {
    angular.forEach(service.log, function(list) {
      for(var i = 0; i < list.length; ++i) {
        var info = list[i];
        if(info.type === type && info.value === value) {
          list.splice(i, 1);
          service.total -= 1;
          emit('remove', info);
          break;
        }
      }
    });
    return service;
  };

  /**
   * Clears all alerts of a given type or all alerts of a given type in a
   * particular category.
   *
   * @param [type] the alert type, null for all..
   * @param [category] the category to clear, omit for all.
   *
   * @return the service for chaining.
   */
  service.clear = function(type, category) {
    if(category) {
      if(!(category in service.category)) {
        throw new Error('Invalid error category: ' + category);
      }
      service.total -= service.log[category].length;
      service.log[category].length = 0;
      emit('clear', category);
      return service;
    }

    // clear all categories
    angular.forEach(service.log, function(list, category) {
      if(!type) {
        service.total -= list.length;
        list.length = 0;
        emit('clear', category);
        return;
      }
      ModelService.removeAllFromArray(list, function(e) {
        if(e.type === type) {
          service.total -= 1;
          return true;
        }
        return false;
      });
      emit('clear', category, type);
    });

    return service;
  };

  /**
   * Clears all feedback alerts.
   *
   * @param [type] the alert type.
   *
   * @return the service for chaining.
   */
  service.clearFeedback = function(type) {
    if(type) {
      service.clear(type, service.category.FEEDBACK);
    } else {
      service.clear(null, service.category.FEEDBACK);
    }
    return service;
  };

  // expose service to scope
  $rootScope.app.services.alert = service;

  return service;
}

return {AlertService: factory};

});
