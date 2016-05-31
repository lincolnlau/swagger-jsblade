require("./sider.html");

module.exports = function($scope) {
  "ngInject";

  $scope.links = [
    { link: "#/home", text:"Home"},
    { link: "#/service", text:"Service"}
  ];

  return $scope;
}