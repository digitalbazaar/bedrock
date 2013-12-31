/*!
 * Navbar.
 *
 * @author Dave Longley
 */
define(['jquery'], function($) {

var deps = ['$scope', '$rootScope'];
return {NavbarCtrl: deps.concat(factory)};

function factory($scope, $rootScope) {
  $scope.model = {};
  $scope.session = window.data.session;

  // get minimum width for navbar
  $scope.minWidth = function() {
    var rval = 0;

    // simulate popover-content
    var el = $([
      '<div class="popover" style="width: auto">',
      '<div class="popover-content"><table><tbody><tr><td>Identity:</td><td>',
      $scope.session.profile.email,
      '</td></tr></tbody></table></div></div>'].join(''));
    $('body').append(el);
    rval = el.outerWidth(true);
    el.remove();

    return rval;
  };

  $scope.refreshData = function() {
    $rootScope.$broadcast('refreshData');
  };
}

});
