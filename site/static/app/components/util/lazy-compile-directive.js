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

    // TODO: automate ID generation and remove need to have user specify
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

        // recompile element and link
        $compile(element)(scope, undefined, {
          parentBoundTranscludeFn: transcludeFn
        });
      }
    };
  }
}

return {brLazyCompile: factory};

});
