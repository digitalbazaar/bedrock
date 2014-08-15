/*!
 * Select directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'E',
    scope: {
      model: '=brModel',
      items: '=brItems',
      display: '&brDisplayItem'
    },
    transclude: true,
    template: '\
      <div class="form-group" data-binding="{{options.name}}"> \
        <label class="{{options.columns.label}} control-label" \
          for="{{options.name}}">{{options.label}}</label> \
        <div class="{{options.columns.select}} input-group"> \
          <span ng-if="options.icon" \
            class="input-group-addon"><i \
            class="fa {{options.icon}}"></i></span> \
          <span ng-if="options.image" \
            class="input-group-addon"><img \
            ng-src="{{options.image}}"></img></span> \
          <ui-select ng-model="selection.selected" data-track-state="help" \
            theme="bootstrap" ng-disabled="options.disabled"> \
            <ui-select-match placeholder="{{options.placeholder}}">{{$select.selected.display}}</ui-select-match> \
            <ui-select-choices repeat="item in viewItems | filter: $select.search"> \
              <div ng-bind-html="item.display | highlight: $select.search"></div> \
            </ui-select-choices> \
          </ui-select> \
          <span class="input-group-btn"> \
            <button type="button" class="btn btn-default" \
              data-help-toggle="help"> \
              <i class="fa fa-question-circle"></i> \
            </button> \
          </span> \
        </div> \
        <div ng-show="help.show" \
          class="{{options.columns.help}} help-block br-fadein br-fadeout"> \
          <div ng-transclude></div> \
        </div> \
      </div>',
    link: Link
  };

  function Link(scope, element, attrs) {
    var selection = scope.selection = {selected: undefined};
    var options = scope.options = {};

    // get options
    scope.$watch(attrs.brOptions, function(value) {
      options = scope.options = value || {};
      options.label = options.label || 'Choose...';
      options.placeholder = options.placeholder || 'Choose...';

      var columns = options.columns = options.columns || {};
      columns.label = columns.label || 'col-sm-3';
      columns.select = columns.select || 'col-sm-8';
      columns.help = columns.help || 'col-sm-offset-3 col-sm-8';
    }, true);

    // update view items when items or display function changes
    scope.$watch('items', updateViewItems, true);
    attrs.$observe('brDisplayItem', function() {
      updateViewItems(scope.items);
    });

    // when external model changes, update selection
    scope.$watch('model', function(value) {
      // find matching view item
      for(var i = 0; value && i < scope.viewItems.length; ++i) {
        var viewItem = scope.viewItems[i];
        if('key' in options && viewItem.item[options.key] === value) {
          selection.selected = viewItem;
          return;
        }
        if(viewItem.item === value) {
          selection.selected = viewItem;
          return;
        }
      }

      // no match found
      selection.selected = undefined;
    }, true);

    // when selection changes, update external model
    scope.$watch('selection.selected', function(selected) {
      if(!selected) {
        scope.model = undefined;
        return;
      }

      if('key' in options) {
        scope.model = selected.item[options.key];
        return;
      }

      // default selects full item
      scope.model = selected.item;
    }, true);

    function updateViewItems(items) {
      scope.viewItems = [];
      if(items === undefined) {
        return;
      }

      var display = scope.display || defaultDisplayItem;
      items.forEach(function(item) {
        scope.viewItems.push({
          item: item,
          display: display.call(scope.$parent, {item: item})
        });
      });
    }

    function defaultDisplayItem(params) {
      return '' + params.item;
    }
  }
}

return {brSelect: factory};

});
