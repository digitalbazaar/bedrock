/*!
 * Spinner directive.
 *
 * Copyright (c) 2012-2014 Digital Bazaar, Inc. All rights reserved.
 *
 * @author Dave Longley
 */
define(['spin'], function(Spinner) {

'use strict';

/* @ngInject */
function factory() {
  return {
    restrict: 'A',
    scope: {
      spin: '=spinner',
      className: '@spinnerClass'
    },
    link: function(scope, element, attrs) {
      // default spinner options
      var options = {
        lines: 11, // The number of lines to draw
        length: 3, // The length of each line
        width: 3, // The line thickness
        radius: 5, // The radius of the inner circle
        rotate: 0, // The rotation offset
        color: '#000', // #rgb or #rrggbb
        speed: 1.0, // Rounds per second
        trail: 100, // Afterglow percentage
        shadow: false, // Whether to render a shadow
        hwaccel: false, // Whether to use hardware acceleration
        className: 'inline-block', // CSS class for spinner
        top: 'auto', // Top position relative to parent in px
        left: 'auto' // Left position relative to parent in px
      };

      // create spinner
      var spinner = new Spinner(options);

      scope.$watch('spin', function(value) {
        if(value) {
          spinner.spin();
          element.append(spinner.el);
        } else {
          spinner.stop();
        }
      });

      attrs.$observe('spinnerClass', function(value) {
        options.className = value;
        spinner.stop();
        spinner = new Spinner(options);
        if(scope.spin) {
          spinner.spin();
          element.append(spinner.el);
        }
      });

      // stop spinning if element is destroyed
      element.bind('$destroy', function() {
        spinner.stop();
      });
    }
  };
}

return {spinner: factory};

});
