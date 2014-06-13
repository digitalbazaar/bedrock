/*!
 * Error Service.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['$rootScope', 'svcModal'];
return {svcError: deps.concat(factory)};

function factory($rootScope, svcModal) {
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
    var origin;
    if(category === service.category.FEEDBACK) {
      var modal = svcModal.getTopModal();
      if(modal === null) {
        origin = 'page';
      } else {
        origin = 'modal';
        // store feedback errors assigned to the modal
        // and remove them when it is destroyed
        modal.data.errors = modal.data.errors || [];
        modal.data.errors.push(error);
        modal.scope.$on('$destroy', function() {
          angular.forEach(modal.data.errors, function(error) {
            service.removeError(error);
          });
        });
      }
    } else {
      origin = 'background';
    }
    service.errors[category].push({error: error, origin: origin});
    $rootScope.$apply();
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

  // expose service to scope
  $rootScope.app.services.error = service;

  return service;
}

});
