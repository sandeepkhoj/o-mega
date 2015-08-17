'use strict';

/* Services */


// Demonstrate how to register services
// In this case it is a simple value service.
var myApp = angular.module('myApp.services', ['btford.socket-io']).
  value('version', '0.1');

myApp.service('compileCode',function($http){
  var apiEndPoint = "/private/compile";
  this.makeCall = function(arg){
    return $http.post(apiEndPoint,arg);
  }
});
myApp.service('assignChallenge',function($http){
  var apiEndPoint = "/private/assignChallenge";
  this.makeCall = function(arg){
    return $http.post(apiEndPoint,arg);
  }
});
myApp.service('testCode',function($http){
  var apiEndPoint = "/private/testCode";
  this.makeCall = function(arg){
    return $http.post(apiEndPoint,arg);
  }
});
myApp.service('pgData',function($http){
  var apiEndPoint = "/pgdata";
  this.makeCall = function(arg){
    return $http.get(apiEndPoint + '?sql='+arg);
  }
});
myApp.service('getUserDetail',function($http){
  var apiEndPoint = "/getUserDetail";
  this.makeCall = function(){
    return $http.get(apiEndPoint);
  }
});
myApp.service('fullStat',function($http){
  var apiEndPoint = "/admin/fullStatus";
  this.makeCall = function(){
    return $http.post(apiEndPoint);
  }
});
myApp.service('register',function($http){
  var apiEndPoint = "/private/register";
  this.makeCall = function(arg){
    return $http.post(apiEndPoint,arg);
  }
});

myApp.factory('pgCall', function ($http) {
    var pgCall = {};
    pgCall.callPostService = function(apiEndPoint, arg) {
        return $http.post(apiEndPoint,arg);
    };
    pgCall.callGetService = function(apiEndPoint) {
        return $http.get(apiEndPoint);
    };
    return pgCall;
});
myApp.factory('externalCall', function ($http) {
    var externalCall = {};
    externalCall.callPostService = function(apiEndPoint, arg) {
        return $http.post(apiEndPoint,arg);
    };
    externalCall.callGetService = function(apiEndPoint) {
        return $http.get(apiEndPoint);
    };
    return externalCall;
});
myApp.factory('internalCall', function ($http) {
    var internalCall = {};
    internalCall.compileCode = function(arg) {
        return $http.post('/private/compile',arg);
    };
    internalCall.testCode = function(arg) {
        return $http.post('/private/testCode',arg);
    };
    internalCall.submitCode = function(arg) {
        return $http.post('/private/submitCode',arg);
    };
    internalCall.submitSQL = function(arg) {
        return $http.post('/private/submitSQL',arg);
    };
    internalCall.viewReload = function(arg) {
        return $http.get('/private/viewLoad?userId='+arg,{
            ignoreLoadingBar: true
        });
    };
    return internalCall;
});

myApp.factory('socket', function (socketFactory) {
  var mySocket = socketFactory();

  return mySocket;
});