'use strict';

var angular = require('angular');
var ngMaterial = require('angular-material');
var uiRouter = require('angular-ui-router');
var ngAnimate = require('angular-animate');
var ngSanitize = require('angular-sanitize');
var ngAria = require('angular-aria');

var appConfig = require('./app/app.config');
var navbarController = require('./app/common/navbar/navbarController.js');
var siderController = require('./app/common/sider/siderController.js');
var homeController = require('./app/home/homeController.js');

angular.module('app', [ngMaterial, ngAnimate, ngSanitize, ngAria, uiRouter])
.config(appConfig)
.controller('navbarController', navbarController)
.controller('siderController', siderController)
.controller('homeController', homeController)