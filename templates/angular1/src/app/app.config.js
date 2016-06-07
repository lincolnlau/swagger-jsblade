module.exports = function($stateProvider, $urlRouterProvider) {
  "ngInject";

  $urlRouterProvider.otherwise('/index')

  $stateProvider
  .state('root', {
    views: {
      'nav': {
        templateUrl: 'app/common/navbar/navbar.html',
        controller: 'navbarController',
        controllerAs: "navbar"
      },
      'sider': {
        templateUrl: 'app/common/sider/sider.html',
        controller: 'siderController',
        controllerAs: 'sider'
      },
      'main': {
        template: '<div ui-view></div>'
      }
    }
  })
  .state('root.home', {
    url: "/index",
    templateUrl: 'app/home/home.html',
    controller: 'homeController',
    controllerAs: 'home'
  })
  .state('root.manager', {
    url: "/manager",
    template: '<h1>Manager</h1>',
  })
  //$locationProvider.html5Mode(true);
}