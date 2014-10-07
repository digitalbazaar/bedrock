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
          removeWatch();
          compile();
        }
      });

      function compile() {
        var el = angular.element($templateCache.get(cacheId)).clone();
        element.append(el);

        if(!transcludeFn) {
          $compile(el)(scope);
          return;
        }

        // FIXME: if transclude scope gets fixed in angular, remove
        transcludeFn = fixTranscludeScope(transcludeFn);

        // compile cached template and link
        $compile(el, transcludeFn)(scope);
      }
    };
  }

  function fixTranscludeScope(transcludeFn) {
    // perform mock transclusion to get default parent scope for
    // transcluded elements (it seems angular doesn't know what this is
    // or uses the wrong scope when you pass transcludeFn to $compile but
    // gets it right when you call transcludeFn directly, so we do a hack
    // to grab it and then rewrite transcludeFn)
    try {
      transcludeFn(function(clone, newScope) {
        // rewrite transcludeFn to use proper scope
        transcludeFn = fixTranscludeFn(transcludeFn, clone, newScope);
      });
    } catch(e) {
      // exceptions may be thrown on the mock transclusion because
      // required transcluded controllers are missing; however this
      // doesn't effect our use of it to obtain the proper scope for
      // compilation, so ignore
    }
    return transcludeFn;
  }

  function fixTranscludeFn(transcludeFn, clone, newScope) {
    // since angular 1.3-rc4+ $parent isn't necessarily the scope that
    // inherited from for non-isolate scopes (rather it is the
    // scope of the "containing element") so use getPrototypeOf here instead
    var parentScope = Object.getPrototypeOf(newScope);

    // ensure unused scope and clone are destroyed and collected
    newScope.$destroy();
    clone.remove();
    clone = newScope = null;

    return function(scope, cloneAttachFn, futureParentElement) {
      // argument adjustment
      if(!isScope(scope)) {
        futureParentElement = cloneAttachFn;
        cloneAttachFn = scope;
      }

      // save containing scope and then destroy unused scope
      var containingScope = scope.$parent;
      scope.$destroy();

      // create new child scope for clone
      scope = parentScope.$new(false, containingScope);
      scope.$$transcluded = true;
      return transcludeFn(scope, cloneAttachFn, futureParentElement);
    };
  }

  function isScope(obj) {
    return obj && obj.$evalAsync && obj.$watch;
  }
}

return {brLazyCompile: factory};

});
