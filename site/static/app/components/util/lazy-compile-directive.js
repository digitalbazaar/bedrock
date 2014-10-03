/*!
 * Lazy compile directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['angular'], function(angular) {

'use strict';

/* @ngInject */
function factory($compile, $templateCache) {
  return {
    restrict: 'A',
    priority: 1,
    terminal: true,
    compile: Compile
  };

  function Compile(tElement, tAttrs) {
    // TODO: change so that lazy-compile can be added as a direct attribute
    // instead of requiring it to be a parent DOM element?

    var cacheId = 'br-lazy-compile-id:' + tAttrs.brLazyCompile;
    var trigger = tAttrs.brCompileTrigger;
    if($templateCache.get(cacheId) === undefined) {
      $templateCache.put(cacheId, tElement.contents());
    }
    tElement.empty();

    return function(scope, element, attrs, ctrls, transcludeFn) {
      // bind-once
      var removeWatch = scope.$watch(trigger, function(value) {
        if(value) {
          compile();
          removeWatch();
        }
      });

      function compile() {
        var el = angular.element($templateCache.get(cacheId)).clone();
        element.append(el);

        if(!transcludeFn) {
          $compile(el)(scope);
          return;
        }

        // perform mock transclusion to get default parent scope for
        // transcluded elements (it seems angular doesn't know what this is
        // or uses the wrong scope when you pass transcludeFn to $compile so
        // we have to hack it in)
        // FIXME: if this gets fixed in angular, instead the call would
        // just be $compile(el, transcludeFn)(scope);
        var compiled = false;
        try {
          transcludeFn(function(clone) {
            // since angular 1.3-rc4+ $parent isn't necessarily the scope that
            // inherited from for non-isolate scopes (rather it is the
            // scope of the "containing element") so use __proto__ here instead
            var parentScope = Object.getPrototypeOf(
              clone.filter('.ng-scope').scope());
            var _transcludeFn = transcludeFn;
            transcludeFn = function(
              scope, cloneAttachFn, futureParentElement, containingScope) {
              // argument adjustment
              if(!isScope(scope)) {
                futureParentElement = cloneAttachFn;
                cloneAttachFn = scope;
              }
              // create new child scope for clone and ensure it gets destroyed
              scope = parentScope.$new(false, containingScope);
              // FIXME: this auto-destroy no longer happens in angular 1.3-rc4+
              // destruction must be done externally
              /*var _cloneAttachFn = cloneAttachFn;
              cloneAttachFn = function(clone, newScope) {
                clone.on('$destroy', function() { newScope.$destroy(); });
                return _cloneAttachFn(clone, newScope);
              };*/
              return _transcludeFn(scope, cloneAttachFn, futureParentElement);
            };

            // compile cached template and link
            $compile(el, transcludeFn)(scope);
            compiled = true;
          });
        } catch(e) {
          // exceptions may be thrown on the mock transclusion because
          // required transcluded controllers are missing; however this
          // doesn't effect our use of it to obtain the proper scope for
          // compilation, so only throw exception if compilation failed
          if(!compiled) {
            throw e;
          }
        }
      }
    };
  }

  function isScope(obj) {
    return obj && obj.$evalAsync && obj.$watch;
  }
}

return {brLazyCompile: factory};

});
