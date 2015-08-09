'use strict';

// Declare app level module which depends on filters, and services

angular.module('myApp', [
  'myApp.controllers',
  'myApp.filters',
  'myApp.services',
  'myApp.directives',
  'ngSanitize','angular-loading-bar','ngRoute','ngAnimate','ngRoute',"xeditable","ngToast",'ui.codemirror','timer','ngCkeditor']).
config(function ($routeProvider, $locationProvider,$httpProvider,ngToastProvider) {

      //================================================
      // Add an interceptor for AJAX errors
      //================================================
      $httpProvider.interceptors.push(function($q, $location) {
        return {
          response: function(response) {
            // do something on success
            return response;
          },
          responseError: function(response) {
            if (response.status === 503)
              $location.url('/login');
            return $q.reject(response);
          }
        };
      });
  $routeProvider.
    when('/', {
      templateUrl: 'partials/home',
      controller: 'homeCtr'
    }).
    when('/dashboard', {
      templateUrl: 'private/view/dashboard',
      controller: 'dashboardCtr'
    }).
      when('/coding/:bucketId', {
        templateUrl: 'private/view/coding',
        controller: 'codingCtr'
      }).
    when('/login', {
      templateUrl: 'partials/login',
      controller: 'loginCtr'
    }).
      when('/users', {
        templateUrl: 'admin/view/users',
        controller: 'usersCtr'
      }).
      when('/userdesc/:id', {
          templateUrl: 'admin/view/userdesc',
          controller: 'userDescCtr'
      }).
      when('/buckets', {
        templateUrl: 'admin/view/buckets',
        controller: 'bucketCtr'
      }).
      when('/winners', {
        templateUrl: 'admin/view/winners',
        controller: 'winnersCtr'
      }).
      when('/fullStat', {
        templateUrl: 'admin/view/fullStat',
        controller: 'fullStatCtr'
      }).
      when('/challenges', {
        templateUrl: 'admin/view/challenges',
        controller: 'challengesCtr'
      }).
      when('/editchallenges/:id', {
          templateUrl: 'admin/view/editchallenge',
          controller: 'editchallengesCtr'
      }).
      when('/editchallenges', {
          templateUrl: 'admin/view/editchallenge',
          controller: 'newchallengesCtr'
      }).
      when('/live', {
          templateUrl: 'admin/view/live',
          controller: 'liveCtr'
      }).
      when('/liveall', {
        templateUrl: 'admin/view/liveall',
        controller: 'liveAllCtr'
      }).
    otherwise({
      redirectTo: '/'
    });
      ngToastProvider.configure({
          verticalPosition: 'bottom',
          horizontalPosition: 'right',
          maxNumber: 0,
          animation:'slide'
      });
  //$locationProvider.html5Mode(true).hashPrefix('!');
});
