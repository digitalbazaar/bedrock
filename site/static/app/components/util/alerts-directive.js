/*!
 * Alerts directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory(AlertService, $compile, $rootScope) {
  return {
    scope: {filterOrigin: '@?', fixed: '@?'},
    templateUrl: '/app/components/util/alerts.html',
    link: Link
  };

  function Link(scope, element, attrs) {
    scope.app = $rootScope.app;
    attrs.$observe('alertCategory', function(value) {
      if(value === undefined) {
        scope.alertCategory = 'all';
      }
    });

    var feedbackArea = element.find('alert-feedback-area');
    var elements = [];

    scope.closeAlert = function(info) {
      AlertService.remove(info.type, info.value);
    };

    AlertService
      .on('add', addAlert)
      .on('remove', function(info) {
        // find info+element pair and remove element
        for(var i = 0; i < elements.length; ++i) {
          if(elements[i].info === info) {
            elements[i].element.remove();
            elements.splice(i, 1);
            break;
          }
        }
      })
      .on('clear', function(category, type) {
        if(!category || category === AlertService.category.FEEDBACK) {
          feedbackArea.empty();
          elements = [];
          if(type) {
            // not all alerts were removed, so rebuild feedback area
            var log = AlertService.log[AlertService.category.FEEDBACK];
            log.forEach(function(info) {
              addAlert(info);
            });
          }
        }
      });

    function addAlert(info) {
      var value = info.value;

      // form error
      if(value.type === 'bedrock.validation.ValidationError') {
        // select forms in an open dialog first, then any parent form, then self
        var target = angular.element('dialog[open]');
        if(target.length) {
          target = target.find('form');
        }
        if(!target.length) {
          target = element.closest('form');
        }
        if(!target.length) {
          target = element;
        }

        // clear previous feedback, add new
        target.find('[data-binding]').removeClass('error');
        angular.forEach(value.details.errors, function(detailError) {
          var binding = detailError.details.path;
          if(binding) {
            // highlight element using data-binding
            target.find('[data-binding="' + binding + '"]').addClass('error');
          }
        });

        return;
      }

      // transclude
      if(value.html) {
        var el = angular.element(value.html);
        var transclusionScope = value.getScope ? value.getScope() : scope;
        $compile(el)(transclusionScope);
        feedbackArea.append(el);
      }
    }
  }
}

return {alerts: factory};

});
