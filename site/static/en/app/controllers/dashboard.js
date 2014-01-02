/*!
 * Identity Dashboard.
 *
 * @author Dave Longley
 * @author David I. Lehn
 */
define(['angular', 'bedrock.api'], function(angular, bedrock) {

var deps = ['$scope', 'svcIdentity', '$timeout'];
return {DashboardCtrl: deps.concat(factory)};

function factory($scope, svcIdentity, $timeout) {
  var model = $scope.model = {};
  var data = window.data || {};
  $scope.profile = data.session.profile;
  $scope.identity = svcIdentity.identity;
  $scope.state = {};
  $scope.modals = {};

  function refresh(force) {
    var opts = {force: !!force};
  }
  $scope.$on('refreshData', function() {
    refresh(true);
  });
  refresh();
}

});
