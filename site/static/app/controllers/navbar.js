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
  // FIXME set based on current page
  $scope.page = 'dashboard';

  $scope.refreshData = function() {
    $rootScope.$broadcast('refreshData');
  };
}

});
