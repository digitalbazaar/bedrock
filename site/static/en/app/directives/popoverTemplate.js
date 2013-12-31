/*!
 * Popover Template directive.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = ['svcTemplateCache', '$compile', '$timeout'];
return {popoverTemplate: deps.concat(factory)};

function factory(svcTemplateCache, $compile, $timeout) {
  // FIXME: popover needs cleanup/rewrite to handle scopes properly and
  // to better deal with placement, etc. -- but wait for bootstrap update to
  // popovers/modals
  return {
    restrict: 'A',
    scope: {
      visible: '=popoverVisible',
      minWidth: '&popoverMinWidth'
    },
    controller: ['$scope', function($scope) {
      // FIXME: use $watch and $parse().assign to get/set visible instead?
      // manually inherit from parent scope because scope is auto-isolated
      // when inheriting 'visible' property w/another name
      for(var prop in $scope.$parent) {
        if($scope.$parent.hasOwnProperty(prop) &&
          !$scope.hasOwnProperty(prop) && prop[0] !== '$') {
          $scope[prop] = $scope.$parent[prop];
        }
      }
    }],
    link: function(scope, element, attrs) {
      svcTemplateCache.get(attrs.popoverTemplate, function(err, data) {
        // initialize popover, toggle on click
        element.popover({
          content: data,
          trigger: 'manual',
          html: true
        }).click(function(e) {
          scope.visible = !scope.visible;
          scope.$apply();
        });

        // update popover content just once
        var once = false;
        var popover = element.data('popover');
        popover.setContent = function() {
          var tip = this.tip();
          tip.find('.popover-title').text(this.getTitle());
          if(!once) {
            tip.find('.popover-content').html(this.getContent());
            once = true;
          }
          tip.removeClass('fade top bottom left right in');
        };

        // compile and link popover when showing (must be done after the
        // popover is attached to the dom)
        var oldShow = popover.show;
        var childScope = null;
        popover.show = function() {
          oldShow.call(popover);
          var tip = this.tip();

          // resize width to fix minimum width
          var minWidth = Math.max(
            scope.minWidth(tip) || 0, tip.outerWidth(true));
          tip.css({width: minWidth});

          // fix positioning for bottom popover
          if(popover.options.placement === 'bottom') {
            // set initial position
            var pos = popover.getPosition(false);
            pos = {top: pos.top + pos.height, left: 0};

            // determine if the parent element has relative positioning
            // (if so, the absolute positioning of the popover will be
            // relative to the parent)
            var parent = tip.parent();
            var isRelative = parent.css('position') === 'relative';
            if(isRelative) {
              var offset = parent.offset();
              pos.top -= offset.top;
              pos.left -= offset.left;
            }

            // calculate left position and position arrow
            var right = element.offset().left + element[0].offsetWidth;
            pos.left += right - tip[0].offsetWidth;
            $('.arrow', tip).css({
              left: tip[0].offsetWidth - element[0].offsetWidth / 2 - 1
            });
            tip.css(pos);
          }

          // compile and link tooltip to scope
          if(childScope) {
            childScope.$destroy();
          }
          childScope = scope.$new();
          $compile(tip)(childScope);

          // hide when pressing escape
          $(document).bind('keyup', hideOnEscape);

          // HACK: $timeout is only used here because the click that shows
          // the popover is being handled after it is shown which immediately
          // closes it
          $timeout(function() {
            // hide popover when clicking away
            $(document).bind('click', hideOnClick);
          });
        };

        // hide popover if clicked-off
        function hideOnClick(e) {
          var tip = popover.tip();
          if($(e.target).closest(tip).length === 0) {
            scope.visible = false;
            if(childScope) {
              childScope.$destroy();
              childScope = null;
            }
            scope.$apply();
          }
        }

        // hide popover if escape is pressed
        function hideOnEscape(e) {
          if(e.keyCode === 27) {
            e.stopPropagation();
            scope.visible = false;
            if(childScope) {
              childScope.$destroy();
              childScope = null;
            }
            scope.$apply();
          }
        }

        // watch for changes to visibility
        var visible = false;
        scope.$watch('visible', function(value) {
          if(value) {
            if(!visible) {
              visible = true;
              element.addClass('active');
              element.popover('show');
            }
          }
          else if(visible) {
            visible = false;
            element.removeClass('active');
            element.popover('hide');
            $(document).unbind('click', hideOnClick);
            $(document).unbind('keyup', hideOnEscape);
          }
        });
      });
    }
  };
}

});
