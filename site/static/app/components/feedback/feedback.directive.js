/*!
 * Feedback directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular', 'jquery'], function(angular, $) {

'use strict';

var deps = [];
return {feedback: deps.concat(factory)};

function factory() {
  /*
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

      alert.append('<button type="button" class="close" data-dismiss="alert">&times;</button>');

      // handle form feedback
      switch(item.type) {
      // generic form errors
      case 'bedrock.validation.ValidationError':
        alert.append('Please correct the information you entered.');
        $.each(item.details.errors, function(i, detailError) {
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
      target: '='
    },
    link: function(scope, element, attrs) {
      var ignore;
      scope.$watch('feedback', function(value) {
        // ignore feedback if it was set to be ignored and there have been
        // no changes to it
        if(scope.feedback === ignore && Object.keys(ignore).length === 0) {
          scope.feedback = {};
          return;
        }
        ignore = {};
        processFeedback(scope, element);
        scope.feedback = ignore;
      }, true);
    }
  };
}

});
