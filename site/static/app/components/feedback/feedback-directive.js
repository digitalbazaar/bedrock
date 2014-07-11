/*!
 * Feedback directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'jquery'], function(angular, $) {

'use strict';

/* @ngInject */
function factory($compile, AlertService) {
  /**
   * Show stack of feedback items ordered as:
   *   errors, alerts, successes, infos
   * scope.feedback is the source of feedback info. It is an object with
   * 'error', 'alert', 'success', and 'info' properties, each can be a single
   * object or an array of objects.
   * Each feedback object should at least have a 'message' property and errors
   * should have a 'type' property.
   * scope.target is used to highlight errors by adding 'error' class to
   * elements with a data-binding property that matches an error details path
   * such as those from validation errors.
   */
  function processFeedbackType(scope, feedbackElement, type) {
    var items = (scope.feedback && scope.feedback[type]) || [];
    if(!angular.isArray(items)) {
      items = [items];
    }
    for(var i = 0; i < items.length; ++i) {
      var item = items[i];
      var alert = $('<div class="alert"/>');
      if(type !== 'alert') {
        alert.addClass('alert-' + type);
      }

      alert.append(
        '<button type="button" class="close" data-ng-click="closeAlert(' +
        "'" + type + "', " + i + ')">&times;</button>');

      // handle form feedback
      switch(item.type) {
      // generic form errors
      case 'bedrock.validation.ValidationError':
        alert.append('Please correct the information you entered.');
        angular.forEach(item.details.errors, function(detailError, i) {
          var binding = detailError.details.path;
          if(binding) {
            // highlight element using data-binding
            $('[data-binding="' + binding + '"]', scope.target)
              .addClass('error');
          }
        });
        break;
      default:
        var message = item.message;
        // FIXME: this should be limited as needed
        if(item.cause && item.cause.message) {
          message = message + ' ' + item.cause.message;
        }
        if(scope.feedback.contactSupport) {
          message = message +
            ' Please <a target="_blank" href="/contact">contact</a> us if ' +
            'you need assistance.';
        }
        alert.append(message);
      }

      $compile(alert)(scope);
      feedbackElement.append(alert);
    }
  }

  function processFeedback(scope, feedbackElement) {
    // clear previous feedback
    $('[data-binding]', scope.target).removeClass('error');
    feedbackElement.empty();

    processFeedbackType(scope, feedbackElement, 'error');
    processFeedbackType(scope, feedbackElement, 'alert');
    processFeedbackType(scope, feedbackElement, 'success');
    processFeedbackType(scope, feedbackElement, 'info');
  }

  return {
    scope: {
      feedback: '=',
      target: '=?'
    },
    link: function(scope, element) {
      // no target specified
      if(!('target' in scope)) {
        // select forms in a visible modal-body first, then any parent form,
        // then self
        scope.target = $('.modal:visible').children('.modal-body');
        if(scope.target.length) {
          scope.target = $('form', scope.target);
        }
        if(!scope.target.length) {
          scope.target = element.closest('form');
        }
        if(!scope.target.length) {
          scope.target = element;
        }
      }
      var displayedFeedback;
      var ignore;
      scope.$watch('feedback', function(value) {
        /* Note: Since we clear scope.feedback from within its own watch
        handler, this will trigger the handler to run again. To avoid an
        infinite loop, we do a special check and exit early. When we clear
        scope.feedback after processing it, we store the empty object we used
        to clear it and then look for that on the next execution of the
        handler. We quit early if scope.feedback is still the same "ignore"
        object and it still has no properties in that object. */
        if(scope.feedback === ignore && Object.keys(ignore).length === 0) {
          scope.feedback = {};
          return;
        }
        ignore = {};
        processFeedback(scope, element);
        displayedFeedback = scope.feedback;
        scope.feedback = ignore;
      }, true);

      scope.closeAlert = function(type, index) {
        var items = (displayedFeedback && displayedFeedback[type]) || [];
        if(!angular.isArray(items)) {
          items = [items];
        }
        AlertService.remove(type, items[index]);
      };
    }
  };
}

return {feedback: factory};

});
