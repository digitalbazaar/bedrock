/*!
 * Date picker directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

var templateReplaced = false;

/* @ngInject */
function datepickerFactory($filter, $templateCache, $timeout) {
  return {
    restrict: 'E',
    scope: {
      model: '=brModel'
    },
    controller: Ctrl,
    controllerAs: 'ctrl',
    bindToController: true,
    template: '\
      <div ng-class="{ \
        \'form-group\': !ctrl.options.inline, \
        \'form-group-inline\': ctrl.options.inline}" \
        br-property-path="{{ctrl.options.name}}" \
        class="{{(ctrl.options.inline && \
          ctrl.options.columns.input) || \'\'}}" \
        ng-style="{display: \
          (ctrl.options.inline ? \'inline-\' : \'\') + \'block\'}"> \
        <label ng-if="ctrl.options.label !== undefined" \
          class="{{ctrl.options.columns.label}} control-label" \
          for="{{ctrl.options.name}}">{{ctrl.options.label}}</label> \
        <div class="input-group \
          {{(!ctrl.options.inline && ctrl.options.columns.input) || \'\'}}"> \
          <span ng-if="ctrl.options.icon" \
            class="input-group-addon"><i \
            class="fa {{ctrl.options.icon}}"></i></span> \
          <span ng-if="ctrl.options.image" \
            class="input-group-addon"><img \
            ng-src="{{ctrl.options.image}}"></img></span> \
          <input class="form-control" \
            type="text" \
            name="{{ctrl.options.name}}" \
            placeholder="{{ctrl.options.placeholder}}" \
            datepicker-popup="{{ctrl.options.format}}" \
            is-open="ctrl.calendarOpen" \
            ng-model="ctrl.date" \
            ng-change="ctrl.change()" \
            ng-blur="ctrl.change()" \
            ng-keyup="($event.which == 13 || $event.which == 27) && \
              ctrl.hideCalendar($event)" \
            ng-disabled="ctrl.options.disabled" \
            br-date-format="{{ctrl.options.format}}" /> \
          <span ng-if="ctrl.options.loading" \
            class="br-spinner-inside-input"> \
            <i class="fa fa-refresh fa-spin text-muted"></i> \
          </span> \
          <span class="input-group-btn"> \
            <button type="button" class="btn btn-default" \
              ng-click="ctrl.showCalendar()"><i \
                class="fa fa-calendar"></i></button> \
          </span> \
        </div> \
      </div>',
    compile: Compile
  };

  function Ctrl() {
    var self = this;
    self.calendarOpen = false;

    self.showCalendar = function() {
      var isOpen = self.calendarOpen;
      $timeout(function() {
        self.calendarOpen = !isOpen;
      });
    };

    self.hideCalendar = function($event) {
      // hide calendar and lose focus
      self.calendarOpen = false;
      if($event) {
        $timeout(function() {
          $event.target.blur();
        });
      }
    };
  }

  function Compile() {
    // TODO: remove this and instead put a datepicker directive inside
    // a stackable and reimplement only the necessary bits of
    // datepicker-popup; this would also solve the need for lazy compile and
    // z-indexing issues at the same time -- it may be possible to achieve
    // this my just replacing other datepicker-related templates w/o any
    // extra code
    if(!templateReplaced) {
      var tpl = '\
      <div> \
        <ul br-lazy-compile="isOpen" br-lazy-compile-id="br-datepicker-popup" \
          class="dropdown-menu" ng-style="{ \
          display: (isOpen && \'block\') || \'none\', \
          top: position.top+\'px\', left: position.left+\'px\'}" \
          ng-keydown="keydown($event)"> \
          <li ng-transclude></li> \
          <li ng-if="showButtonBar" style="padding:10px 9px 2px"> \
            <span class="btn-group pull-left"> \
              <button type="button" class="btn btn-sm btn-info" \
                ng-click="select(\'today\')">{{getText(\'current\')}}</button> \
              <button type="button" class="btn btn-sm btn-danger" \
                ng-click="select(null)">{{getText(\'clear\')}}</button> \
            </span> \
            <button type="button" class="btn btn-sm btn-success pull-right" \
              ng-click="close()">{{ getText(\'close\') }}</button> \
          </li> \
        </ul> \
      </div>';
      $templateCache.put('template/datepicker/popup.html', tpl);
      templateReplaced = true;
    }
    return Link;
  }

  function Link(scope, element, attrs, ctrl) {
    // FIXME: temporary fix for angular memory leak:
    // https://github.com/angular/angular.js/issues/10509
    var formCtrl = element.inheritedData('$formController');
    if(formCtrl) {
      // clear reference to ngModelCtrl in parent form controller
      scope.$on('$destroy', function() {
        if(formCtrl.$$success) {
          delete formCtrl.$$success.date;
          delete formCtrl.$$success['date-disabled'];
        }
        if(formCtrl.$$error) {
          delete formCtrl.$$error.date;
          delete formCtrl.$$error['date-disabled'];
        }
      });
    }

    scope.$watch(function() {
      return ctrl.model;
    }, function(value) {
      if(value) {
        if(typeof value === 'string' || (
          ctrl.options && ctrl.options.modelType === 'string')) {
          ctrl.date = new Date(value);
        } else {
          ctrl.date = value;
        }
      }
    });

    // when date changes, update model
    var dateFilter = $filter('date');
    ctrl.change = function() {
      if(ctrl.date) {
        if(ctrl.options.time) {
          // add time option
          ctrl.date = setTime(ctrl.date, ctrl.options.time);
        }
        if(ctrl.options.modelType === 'string') {
          ctrl.model = dateFilter(ctrl.date, ctrl.options.format);
        } else {
          ctrl.model = ctrl.date;
        }
      }
    };

    // handle options
    attrs.brOptions = attrs.brOptions || {};
    attrs.$observe('brOptions', function(value) {
      var options = ctrl.options = scope.$eval(value) || {};
      options.format = ('format' in options) ? options.format : 'yyyy-MM-dd';
      options.placeholder = options.placeholder || '';
      options.inline = ('inline' in options) ? options.inline : false;
      options.modelType = ('modelType' in options) ? options.modelType : 'date';

      // prefix "fa-" to icon
      if(typeof options.icon === 'string' &&
        options.icon.indexOf('fa-') !== 0) {
        options.icon = 'fa-' + options.icon;
      }

      var columns = options.columns = options.columns || {};
      if(!('label' in columns)) {
        columns.label =  'col-sm-3';
      }
      if(!('input' in columns)) {
        columns.input = 'col-sm-8';
      }

      if('autocomplete' in options) {
        element.find('input').attr('autocomplete', options.autocomplete);
      } else {
        element.find('input').removeAttr('autocomplete');
      }

      if(options.autofocus) {
        element.find('input').attr('autofocus', 'autofocus');
      } else {
        element.find('input').removeAttr('autofocus');
      }

      if(options.readonly) {
        element.find('input').attr('readonly', 'readonly');
      } else {
        element.find('input').removeAttr('readonly');
      }

      ctrl.change();
    });
  }

  function setTime(date, time) {
    date = new Date(
      date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    date.setTime(date.getTime() + time);
    return date;
  }
}

/* @ngInject */
function dateFormatFactory($filter) {
  // FIXME: this directive is merely a bug fix for ui-bootstrap datepicker
  // rendering (enforces the date format and prevents date changes while
  // the input field is in focus); remove it once the bug is fixed
  // TODO: submit PR (that uses formatters, etc. instead of replacing $render)
  return {
    restrict: 'A',
    require: 'ngModel',
    link: function(scope, element, attrs, ctrl) {
      var dateFormat = 'yyyy-MM-dd';
      var dateFilter = $filter('date');
      ctrl.$render = function() {
        if(element.is(':focus')) {
          return;
        }
        element.val(dateFilter(ctrl.$modelValue, dateFormat));
      };
      attrs.$observe('brDateFormat', function(value) {
        dateFormat = value;
      });
    }
  };
}

return {brDatepicker: datepickerFactory, brDateFormat: dateFormatFactory};

});
