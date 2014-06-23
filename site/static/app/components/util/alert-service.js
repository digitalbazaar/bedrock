/*!
 * Alert Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$rootScope', 'ModalService', 'ModelService'];
return {AlertService: deps.concat(factory)};

function factory($rootScope, ModalService, ModelService) {
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

  /**
   * Adds an alert to the log.
   *
   * @param type the type of alert ('error', 'warning', 'info').
   * @param value the alert to add.
   * @param category an optional category for the alert,
   *          default: service.category.FEEDBACK.
   */
  service.add = function(type, value, category) {
    if(typeof value === 'string') {
      value = {message: value};
    }
    category = category || service.category.FEEDBACK;
    var info = {type: type, value: value};
    if(category === service.category.FEEDBACK) {
      var modal = ModalService.getTopModal();
      if(modal === null) {
        info.origin = 'page';
      } else {
        info.origin = 'modal';
        info.source = modal;
        // remove alert when the modal is destroyed
        modal.scope.$on('$destroy', function() {
          service.remove(type, value);
        });
      }
    } else {
      info.origin = 'background';
    }
    service.log[category].push(info);
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
          break;
        }
      }
    });
  };

  /**
   * Clears all alerts of a given type or all alerts of a given type in a
   * particular category.
   *
   * @param [type] the alert type.
   * @param [category] the category to clear, omit for all.
   */
  service.clear = function(type, category) {
    if(category) {
      if(!(category in service.category)) {
        throw new Error('Invalid error category: ' + category);
      }
      service.log[category].length = 0;
      return;
    }

    // clear all categories
    angular.forEach(service.log, function(list) {
      if(!type) {
        list.length = 0;
        return;
      }
      ModelService.removeAllFromArray(list, function(e) {
        return e.type === type;
      });
    });
  };

  /**
   * Clears all feedback alerts from the given modal.
   *
   * @param [type] the alert type.
   * @param modal the modal to remove alerts for (modal may be the modal API,
   *          its scope, or scope.modal).
   */
  service.clearModalFeedback = function(type, modal) {
    if(arguments.length === 1) {
      modal = type;
      type = undefined;
    }
    if(!modal) {
      return;
    }
    var list = service.log[service.category.FEEDBACK];
    ModelService.removeAllFromArray(list, function(e) {
      return ((!type || e.type === type) && e.source &&
        (e.source === modal || e.source.scope === modal ||
        e.source.scope.modal === modal));
    });
  };

  /**
   * Clears all feedback alerts of the given type from the top-level modal.
   *
   * @param [type] the alert type.
   */
  service.clearTopModalFeedback = function(type) {
    service.clearModalFeedback(ModalService.getTopModal(), type);
  };

  // expose service to scope
  $rootScope.app.services.alert = service;

  return service;
}

});
