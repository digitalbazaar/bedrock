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
    restrict: 'A',
    scope: {filterOrigin: '@?brFilterOrigin', fixed: '@?brFixed'},
    templateUrl: '/app/components/alert/alerts.html',
    link: Link
  };

  function Link(scope, element, attrs) {
    scope.app = $rootScope.app;
    attrs.$observe('brAlertCategory', function(value) {
      if(value === undefined) {
        scope.alertCategory = 'all';
      }
    });

    var elements = {};
    for(var key in AlertService.category) {
      elements[AlertService.category[key]] = [];
    }

    scope.closeAlert = function(info) {
      AlertService.remove(info.type, info.value);
    };

    AlertService
      .on('add', addAlert)
      .on('remove', function(info) {
        // find info+element pairs and remove elements
        var list = elements[info.category];
        for(var i = 0; i < list.length; ++i) {
          if(list[i].info === info) {
            list[i].element.remove();
            list.splice(i, 1);
          }
        }
      })
      .on('clear', function(category, type) {
        if(category) {
          return clearAlerts(category, type);
        }
        for(var key in elements) {
          clearAlerts(key, type);
        }
      });

    function addAlert(info) {
      var value = info.value;

      // transclude
      if(value.html) {
        var el = angular.element('<div class="alert"></div>');
        el.addClass('alert-' + info.type);
        el.append('<button type="button" class="close">&times;</button>');
        el.append(value.html);
        el.first().one('click', function() {
          scope.closeAlert(info);
          scope.$apply();
        });
        var transclusionScope = value.getScope ? value.getScope() : scope;
        $compile(el)(transclusionScope);
        element.find('.br-alert-area-' + info.category).append(el);
        return;
      }

      // form error
      if(value.type === 'bedrock.validation.ValidationError') {
        // select forms in open dialogs first, then any non-dialog visible
        // forms, then self
        var target;
        var dialog = angular.element('dialog[open]');
        if(dialog.length) {
          target = dialog.find('form');
          if(!target.length) {
            target = dialog;
          }
        } else {
          target = angular.element(':not(dialog) form:visible');
        }
        if(!target.length) {
          target = element;
        }

        // clear previous feedback, add new
        target.find('[br-property-path]').removeClass('has-error');
        angular.forEach(value.details.errors, function(detailError) {
          var path = detailError.details.path;
          if(path) {
            // highlight element using br-property-path
            target.find('[br-property-path="' + path + '"]').addClass(
              'has-error');
          }
        });
      }
    }

    function clearAlerts(category, type) {
      element.find('.br-alert-area-' + category).empty();
      elements[category] = [];
      if(type) {
        // not all alerts were removed, so rebuild alert area
        var log = AlertService.log[category];
        log.forEach(addAlert);
      }
    }
  }
}

return {brAlerts: factory};

});
