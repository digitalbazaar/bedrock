/*!
 * Selector Modal.
 *
 * @author Dave Longley
 */
define([], function() {

var deps = ['svcModal'];
return {modalSelector: deps.concat(factory)};

function factory(svcModal) {
  return svcModal.directive({
    name: 'Selector',
    scope: {
      modalTitle: '=',
      items: '=',
      itemType: '='
    },
    transclude: true,
    templateUrl: '/app/templates/modals/selector.html'
  });
}

});
