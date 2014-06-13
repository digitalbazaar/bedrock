/*!
 * Error Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$rootScope', 'svcModal', 'svcModel'];
return {svcError: deps.concat(factory)};

function factory($rootScope, svcModal, svcModel) {
  var service = {};

  // defined categories
  service.category = {
    FEEDBACK: 'FEEDBACK',
    BACKGROUND: 'BACKGROUND'
  };

  // lists of categorized errors
  service.errors = {};
  angular.forEach(service.category, function(c) {
    service.errors[c] = [];
  });

  /**
   * Adds an error to the log of errors that have occurred
   * since the log was last cleared.
   *
   * @param error the error to add.
   * @param category an optional error category for the error,
   *          default: service.category.FEEDBACK.
   */
  service.addError = function(error, category) {
    if(typeof error === 'string') {
      error = {message: error};
    }
    category = category || service.category.FEEDBACK;
    var info = {error: error};
    if(category === service.category.FEEDBACK) {
      var modal = svcModal.getTopModal();
      if(modal === null) {
        info.origin = 'page';
      } else {
        info.origin = 'modal';
        info.source = modal;
        // remove error when the modal is destroyed
        modal.scope.$on('$destroy', function() {
          service.removeError(error);
        });
      }
    } else {
      info.origin = 'background';
    }
    service.errors[category].push(info);
  };

  /**
   * Removes the given error, regardless of which category it is in.
   *
   * @param error the error to remove.
   */
  service.removeError = function(error) {
    angular.forEach(service.errors, function(list) {
      for(var i = 0; i < list.length; ++i) {
        if(list[i].error === error) {
          list.splice(i, 1);
          break;
        }
      }
    });
  };

  /**
   * Clears all errors or all errors in a particular category.
   *
   * @param [category] the category to clear, omit for all.
   */
  service.clearErrors = function(category) {
    if(category) {
      if(!(category in service.category)) {
        throw new Error('Invalid error category: ' + category);
      }
      service.errors[category].length = 0;
      return;
    }

    // clear all categories
    angular.forEach(service.errors, function(list) {
      list.length = 0;
    });
  };

  /**
   * Clears all feedback errors from the given modal.
   *
   * @param modal the modal to remove errors for (modal may be the modal API,
   *          its scope, or scope.modal).
   */
  service.clearModalErrors = function(modal) {
    if(!modal) {
      return;
    }
    var list = service.errors[service.category.FEEDBACK];
    svcModel.removeAllFromArray(list, function(e) {
      return (e.source && (e.source === modal || e.source.scope === modal ||
        e.source.scope.modal === modal));
    });
  };

  /**
   * Clears all feedback errors from the top-level modal.
   */
  service.clearTopModalErrors = function() {
    service.clearModalErrors(svcModal.getTopModal());
  };

  // expose service to scope
  $rootScope.app.services.error = service;

  return service;
}

});
