require('./navbar.html');

module.exports = function($scope) {
  "ngInject";
  $scope.userName = 'Lincoln Lau';

  return $scope;
}