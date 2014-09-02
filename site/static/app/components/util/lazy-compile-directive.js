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

    //console.log('doing lazy compile', tElement[0]);
    var cacheId = 'lazy-compile-id:' + tAttrs.brLazyCompile;
    var trigger = tAttrs.brCompileTrigger;
    if($templateCache.get(cacheId) === undefined) {
      $templateCache.put(cacheId, tElement.html().trim());
    }
    tElement.empty();

    return function(scope, element, attrs, ctrls, transcludeFn) {
      var parentTranscludeScope;

      // TODO: change to bind-once
      scope.$watch(trigger, function(value) {
        //console.log('trigger changed', value, scope);
        if(parentTranscludeScope) {
          // already compiled
          return;
        }
        if(value) {
          compile();
        }
      });

      function compile() {
        // perform initial transclusion to get default parent scope for
        // transcluded elements (angular doesn't know what this is when
        // you pass transcludeFn to $compile so we have to hack it in)
        transcludeFn(function(clone) {
          parentTranscludeScope = clone.filter('.ng-scope').scope().$parent;
          var _transcludeFn = transcludeFn;
          transcludeFn = function(scope, cloneAttachFn, futureParentElement) {
            // argument adjustment
            if(!isScope(scope)) {
              futureParentElement = cloneAttachFn;
              cloneAttachFn = scope;
            }
            // FIXME: does passed scope need to be destroyed?
            /*
            if(scope) {
              scope.$destroy();
            }*/
            // create new child scope for clone and ensure it gets destroyed
            scope = parentTranscludeScope.$new();
            var _cloneAttachFn = cloneAttachFn;
            cloneAttachFn = function(clone, newScope) {
              clone.on('$destroy', function() { newScope.$destroy(); });
              return _cloneAttachFn(clone, newScope);
            };
            return _transcludeFn(scope, cloneAttachFn, futureParentElement);
          };

          // compile cached template and link
          var el = angular.element($templateCache.get(cacheId));
          element.append(el);
          $compile(el, transcludeFn)(scope);
        });
      }
    }
  }

  function isScope(obj) {
    return obj && obj.$evalAsync && obj.$watch;
  }
}

return {brLazyCompile: factory};

});
