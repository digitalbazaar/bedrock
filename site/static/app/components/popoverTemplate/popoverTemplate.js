/*!
 * Popover Template directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

var deps = ['svcTemplateCache', '$compile', '$parse', '$timeout'];
return {popoverTemplate: deps.concat(factory)};

function factory(svcTemplateCache, $compile, $parse, $timeout) {
  // FIXME: popover needs cleanup/rewrite to handle scopes properly and
  // to better deal with placement, etc. -- but wait for bootstrap update to
  // popovers/modals, would be nice to use transclusion
  return {
    restrict: 'A',
    link: function(scope, element, attrs) {
      var getVisible = $parse(attrs.popoverVisible);
      var setVisible = getVisible.assign || angular.noop;
      scope.getVisible = function() {
        return getVisible(scope);
      };
      scope.setVisible = function(visible) {
        setVisible(scope, visible);
      };
      svcTemplateCache.get(attrs.popoverTemplate, function(err, data) {
        // initialize popover, toggle on click
        var container = element.closest('.modal-body');
        if(!container.length) {
          container = 'body';
        }
        element.popover({
          container: container,
          content: data,
          trigger: 'manual',
          html: true,
        }).click(function(e) {
          scope.$apply(function() {
            scope.setVisible(!scope.getVisible());
          });
        });

        // update popover content just once
        var once = false;
        var popover = element.data('popover');
        popover.setContent = function() {
          var tip = this.tip();
          var title = this.getTitle();
          if(!title) {
            tip.find('.popover-title').hide();
          }
          else {
            tip.find('.popover-title').text(title);
            tip.find('.popover-title').show();
          }
          if(!once) {
            tip.find('.popover-content').html(this.getContent());
            once = true;

            // if popover is a dropdown menu, do specialized styling
            var content = tip.find('.popover-content');
            var menu = content.find('.dropdown-menu');
            if(menu.parent().hasClass('popover-content')) {
              menu.css({display: 'block'});
              tip.css({border: 'none', padding: 0, margin: 0});
              content.css({padding: 0});
              tip.find('.arrow').css({display: 'none'});
              // hide popover if menu item is clicked
              menu.find('a').click(function() {
                scope.$apply(function() {
                  scope.setVisible(false);
                });
              });
            }
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

          // simulate popover content
          var tmpTip = $([
            '<div class="popover" style="width: auto">',
            '<div class="popover-content">',
            data,
            '</div></div>'].join(''));
          $('body').append(tmpTip);
          var tmpScope = scope.$new();
          $compile(tmpTip)(tmpScope);

          // allow for async linking
          $timeout(function() {
            // get minimum popover width and remove simulated element
            var minWidth = tmpTip.outerWidth(true);
            tmpTip.remove();
            tmpScope.$destroy();
            minWidth = Math.max(minWidth || 0, tip.outerWidth(true));
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

            // hide popover when clicking away
            $(document).bind('click', hideOnClick);
            $('a').bind('click', hideOnClick);
          });
        };

        // hide popover if clicked-off
        function hideOnClick(e) {
          var tip = popover.tip();
          if($(e.target).closest(tip).length === 0) {
            scope.setVisible(false);
            scope.$apply();
          }
        }

        // hide popover if escape is pressed
        function hideOnEscape(e) {
          if(e.keyCode === 27) {
            e.stopPropagation();
            scope.setVisible(false);
            scope.$apply();
          }
        }

        // watch for changes to visibility
        var visible = false;
        scope.$watch(attrs.popoverVisible, function(value) {
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
            $('a').unbind('click', hideOnClick);
            $(document).unbind('keyup', hideOnEscape);
          }
        });
      });
    }
  };
}

});
