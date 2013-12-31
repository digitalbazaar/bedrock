/*!
 * Modal Service.
 *
 * @author Dave Longley
 */
define(['angular', 'jquery'], function(angular, $) {

var deps = [
  '$compile', '$controller', '$rootScope',
  '$templateCache', 'svcTemplateCache'];
return {svcModal: deps.concat(factory)};

function factory(
  $compile, $controller, $rootScope, $templateCache, svcTemplateCache) {
  var service = {};

  // the stack of currently open modals
  var modals = [];

  // shared modal options
  var modalOptions = {
    backdrop: 'static',
    keyboard: false,
    show: false
  };

  // destroy top modal when escape is pressed
  $(document).keyup(function(e) {
    if(e.keyCode === 27) {
      e.stopPropagation();
      if(modals.length > 0) {
        modals[modals.length - 1]._angular.destroy(true);
      }
    }
  });

  /**
   * Creates a customized modal directive. The return value of this
   * method should be passed to a module's directive method.
   *
   * @param options the directive options.
   *          templateUrl the URL to the template for the modal.
   *          [name] the name of the modal to use, set to the 'visible' var.
   *          [transclude] optional transclusion setting.
   *          [scope] optional isolate scope for the modal.
   *          [controller] optional controller for the modal.
   *          [link] optional link function for the modal, where 'attrs' uses
   *            the directive's attributes object.
   *
   * @return the directive configuration.
   */
  service.directive = function(options) {
    var isolatedScope = {
      visible: '=modalVisible',
      _callback: '&modalOnClose'
    };
    if('name' in options) {
      isolatedScope.visible = '=modal' + options.name;
    }
    angular.extend(isolatedScope, options.scope || {});
    options.controller = options.controller || angular.noop;
    options.link = options.link || angular.noop;
    return {
      scope: isolatedScope,
      transclude: options.transclude || false,
      compile: function(tElement, tAttrs, transcludeLinker) {
        // link function
        return function(scope, element, attrs) {
          // pre-fetch modal template
          svcTemplateCache.get(options.templateUrl, function(err, data) {
            // create modal when visible is true, destroy when false
            var modal = null;
            scope.$watch('visible', function(value) {
              if(value) {
                modal = createModal(options, scope, attrs, transcludeLinker);
              }
              else if(modal) {
                modal._angular.destroy();
              }
            });

            // setup directive scope modal vars
            scope.modal = scope.modal || {};

            // ignore enter presses in the modal by default
            scope.modal.allowEnter = attrs.modalEnter || false;

            // does any custom init work when modal opens
            scope.modal.open = scope.modal.open || angular.noop;

            // closes and destroys modal on success
            scope.modal.close = function(err, result) {
              scope.modal.error = err;
              scope.modal.result = result;
              scope.modal.success = true;
              if(modal) {
                modal._angular.destroy();
              }
            };
          });
        };
      }
    };
  };

  /**
   * Creates and opens the modal.
   *
   * @param options the directive options.
   * @param directiveScope the directive's scope.
   * @param attrs the directive element's attributes.
   * @param transcludeLinker the directive's transclusion linker function.
   *
   * @return the modal.
   */
  function createModal(options, directiveScope, attrs, transcludeLinker) {
    // create child scope for modal
    var childScope = directiveScope.$new();
    var transcludeFn = function(scope, cloneAttachFn) {
      // link and attach transcluded elements
      var clone = transcludeLinker(
        directiveScope.$parent.$new(), function(clone) {
        cloneAttachFn(clone);
      });
      return clone;
    };

    // create new modal element
    var template = $templateCache.get(options.templateUrl);
    if(angular.isArray(template)) {
      // cached http response [http response code, value]
      template = template[1];
    }
    var element = $(template);
    $compile(element, transcludeFn)(childScope);

    // initialize modal
    element.addClass('hide');
    element.modal(modalOptions);
    var modal = element.data('modal');

    // make modal full-screen scrollable
    var _backdrop = modal.backdrop;
    modal.backdrop = function(callback) {
      callback = callback || angular.noop;
      _backdrop.call(modal, callback);

      // replace click handler on backdrop because backdrop element
      // now contains the modal
      if(modal.isShown && modal.options.backdrop) {
        modal.$backdrop.unbind('click');
        modal.$backdrop.click(function(event) {
          // only focus/hide if the click is on the backdrop itself
          if(event.target === modal.$backdrop[0]) {
            if(modal.options.backdrop === 'static') {
              element.focus();
            }
            else {
              modal.hide();
            }
          }
        });
      }

      // create modal wrapper
      if(modal.isShown && modal.options.backdrop) {
        var $elementWrapper = $('<div class="modal-wrapper" />');
        $elementWrapper.prependTo(modal.$backdrop);
        element.prependTo($elementWrapper);

        // disable background scrolling
        $('body').css({overflow: 'hidden'});
      }
    };
    var _removeBackdrop = modal.removeBackdrop;
    modal.removeBackdrop = function() {
      element.insertAfter(modal.$backdrop);
      _removeBackdrop.call(modal);

      // re-enable background scrolling if modal is not stacked
      if(!modal._angular.parent && !modal._angular.hasChild) {
        $('body').css({overflow: 'auto'});
      }

      // needed here because insertAfter is required for stacked modals
      // even after the element has been removed from the dom due to destroy
      if(modal._angular.destroyed) {
        element.remove();
      }
    };

    // additional angular API on bootstrap modal
    modal._angular = {};

    /** Run modal controller and show the modal. */
    modal._angular.openAndShow = function() {
      // create modal controller
      var locals = {
        $scope: childScope,
        $element: element,
        $attrs: attrs,
        $transclude: transcludeFn
      };
      modal._angular.controller = $controller(options.controller, locals);

      // do custom linking on modal element
      options.link(childScope, element, attrs);

      // only do fade transition if no parent
      if(!modal._angular.parent) {
        // firefox animations are broken
        if(!$.browser.mozilla) {
          element.addClass('fade');
        }
      }
      element.modal('show');
    };

    /** Shortcut to show modal. */
    modal._angular.show = function() {
      element.modal('show');
    };

    /** Shortcut to hide modal. */
    modal._angular.hide = function() {
      element.modal('hide');
    };

    /**
     * Destroys a modal.
     *
     * @param doApply true if a digest is required.
     */
    modal._angular.destroy = function(doApply) {
      // only destroy once
      if(modal._angular.destroyed) {
        return;
      }
      modal._angular.destroyed = true;

      // remove modal from stack, notify directive of visibility change
      modals.pop();
      directiveScope.visible = false;

      // set error to canceled if success is not set
      if(!directiveScope.modal.error && !directiveScope.modal.success) {
        directiveScope.modal.error = 'canceled';
      }

      // only do fade transition when no parent
      if(!modal._angular.parent) {
        // firefox animations are broken
        if(!$.browser.mozilla) {
          element.addClass('fade');
        }
      }
      // hide modal
      modal._angular.hide();

      // call directive scope's callback
      if(directiveScope._callback) {
        directiveScope._callback.call(directiveScope, {
          err: directiveScope.modal.error,
          result: directiveScope.modal.result
        });
      }

      if(doApply) {
        $rootScope.$apply();
      }
    };

    /** Note: Code below prepares and opens newly created modal. */

    // reinit directive scope
    directiveScope.modal.success = false;
    directiveScope.modal.error = null;
    directiveScope.modal.result = null;

    // handle enter key
    element.keypress(function(e) {
      if(e.keyCode === 13 && !directiveScope.modal.allowEnter) {
        e.preventDefault();
      }
    });

    // close modal when it is hidden and has no child
    element.on('hide', function() {
      if(!modal._angular.hasChild) {
        modal._angular.destroy(true);
      }
    });

    element.on('shown', function() {
      // firefox animations are broken
      if(!$.browser.mozilla) {
        // prevent auto fade transition on next hide
        element.removeClass('fade');
      }
    });
    element.on('hidden', function() {
      // firefox animations are broken
      if(!$.browser.mozilla) {
        // prevent auto fade transition on next show
        element.removeClass('fade');
      }

      // show parent when hidden and no child
      if(modal._angular.parent && !modal._angular.hasChild) {
        modal._angular.parent._angular.hasChild = false;
        modal._angular.parent._angular.show();
      }

      if(modal._angular.destroyed) {
        element.remove();
      }
    });

    // auto-bind any .btn-close classes here
    $('.btn-close', element).click(function(e) {
      e.preventDefault();
      modal._angular.destroy(true);
    });

    // get the parent modal, if any
    var parent = (modals.length > 0) ? modals[modals.length - 1] : null;

    // add modal to stack
    modal._angular.parent = parent;
    modal._angular.hasChild = false;
    modals.push(modal);

    if(parent) {
      // hide parent first, then show child
      parent._angular.hasChild = true;
      parent.$element.one('hidden', function() {
        modal._angular.openAndShow();
      });
      parent._angular.hide();
    }
    else {
      modal._angular.openAndShow();
    }

    return modal;
  }

  return service;
}

});
