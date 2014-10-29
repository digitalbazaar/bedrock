/*!
 * Lazy compile directive.
 *
 * Copyright (c) 2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define([], function() {

'use strict';

/* @ngInject */
function factory($compile, $templateCache) {
  return {
    restrict: 'A',
    // run before just about anything else
    priority: 2000,
    terminal: true,
    compile: Compile
  };

  function Compile(tElement, tAttrs) {
    var contents = tElement.contents();

    // use template cache for contents if requested
    if('brLazyId' in tAttrs) {
      var cacheId = 'br-lazy-compile-id:' + tAttrs.brLazyId;
      var cached = $templateCache.get(cacheId);
      if(cached === undefined) {
        $templateCache.put(cacheId, contents);
      } else {
        // use cached contents (allow local contents to be GC'd)
        contents = cached;
      }
    }
    tElement.empty();

    return function(scope, element, attrs, ctrls, transcludeFn) {
      // bind-once to br-lazy-compile=<expression>
      var removeWatch = scope.$watch(tAttrs.brLazyCompile, function(value) {
        if(value) {
          removeWatch();
          compile();
        }
      });

      function compile() {
        // add contents back
        // TODO: avoid clone, if possible, when not using template cache
        element.append(contents.clone());

        // avoid recursion during compile
        element.removeAttr('br-lazy-compile');
        element.removeAttr('br-lazy-id');

        // compile contents and link

        // FIXME: remove when AngularJS 1.3.1 API is ready
        if(!transcludeFn) {
          $compile(element)(scope);
          return;
        }
        transcludeFn = fixTranscludeScope(transcludeFn);
        $compile(element, transcludeFn)(scope);

        // FIXME: use when AngularJS 1.3.1 API is ready
        /* $compile(el)(scope, undefined, {
          parentBoundTranscludeFn: transcludeFn
        });*/
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
