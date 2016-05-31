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
      'main': {
        templateUrl: 'app/main.html',
        controller: 'mainController',
        controllerAs: 'main'
      }
    }
  })
  .state('root.main', {
    views: {
      'sider': {
        templateUrl: 'app/common/sider/sider.html',
        controller: 'siderController',
        controllerAs: 'sider'
      },
      'content':{
         template: '<div ui-view></div>'
      }
    }
  })
  .state('root.main.home', {
    url: "/index",
    templateUrl: 'app/home/home.html',
    controller: 'homeController',
    controllerAs: 'home'
  })
  .state('root.main.manager', {
    url: "/manager",
    template: '<h1>Hello</h1>',
  })
  //$locationProvider.html5Mode(true);
}