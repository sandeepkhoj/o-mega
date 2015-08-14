'use strict';

/* Controllers */

var app = angular.module('myApp.controllers', []);
app.controller('AppCtrl', function ($scope, $http) {

    $http({
      method: 'GET',
      url: '/api/name'
    }).
    success(function (data, status, headers, config) {
      $scope.name = data.name;
    }).
    error(function (data, status, headers, config) {
      $scope.name = 'Error!';
    });

  });
app.controller('codingCtr', function ($scope,internalCall,pgCall,externalCall,$routeParams,$rootScope,$location,$sce,ngToast) {
    $scope.bucket_id = $routeParams.bucketId;

    $scope.editorOptions = {
        lineNumbers: true,
        matchBrackets: true,
        mode: "text/x-java",
        theme:"eclipse"
    };

    $scope.input = '';
    $scope.result;
    $scope.challenge;
    $scope.testCase = {testCase1:false,testCase2:false,testCase3:false,testCase4:false,testCase5:false};
    $scope.allowedlanguage = [];

    $scope.init = function() {
        externalCall.callGetService('/getUserDetail').success(function(response){
            //console.log(response);
            if(typeof response.photoLink == "undefined") {
                $rootScope.user = null;
                $location.url('/');
            }
            else {
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
                loadChallenge();
            }
        });

    };
    function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes*60000);
    }

    function loadChallenge(){
        pgCall.callGetService('/private/viewChallenge?uid='+$rootScope.user.uid+'&bucketId='+$scope.bucket_id).success(function(response){
            console.log(response);
            if(response.length>0 && response[0].challengeid != null) {
                $scope.challenge = response[0];
                if($scope.challenge.timestamp != null) {
                    $scope.challenge.counter = addMinutes(new Date($scope.challenge.timestamp), $scope.challenge.timer).getTime() - new Date().getTime();
                    console.log($scope.challenge.counter);
                    if($scope.challenge.counter > 0) {
                        $scope.challenge.counter = Math.round(Math.abs($scope.challenge.counter / 1000));
                    }
                    else {
                        $scope.challenge.counter = 0;
                    }
                    console.log($scope.challenge.counter);
                    console.log(addMinutes(new Date($scope.challenge.timestamp), $scope.challenge.timer));
                    console.log(new Date($scope.challenge.timestamp));
                }
                else {
                    $scope.challenge.counter = 0;
                }
                $scope.challenge.description = $sce.trustAsHtml($scope.challenge.description);

                if($scope.challenge.code == null) {
                    $scope.challenge.code = $scope.challenge.starter_code_java;
                }

                if($scope.challenge.language == null) {
                    $scope.allowedlanguage = [
                        {value: "Java", text: 'Java'},
                        {value: "C", text: 'C'},
                        {value: "C++", text: 'C++'}
                    ];
                }
                else if($scope.challenge.language == 'Java') {
                    $scope.allowedlanguage = [
                        {value: "C", text: 'C'},
                        {value: "C++", text: 'C++'}
                    ];
                }
                else {
                    $scope.allowedlanguage = [
                        {value: "Java", text: 'Java'}
                    ];
                }
                if($scope.challenge.code_language == null) {
                    $scope.challenge.code_language = 'Java';
                }
                console.log($scope.challenge.code_language);
                if($scope.challenge.userchallengeid == null) {
                    pgCall.callPostService('/private/openProblem', {
                        userId: $rootScope.user.uid,
                        challengeid: $scope.challenge.bucket_challenge
                    });
                }
                $scope.$on('$locationChangeStart', function(event, next, current) {
                    if(!$scope.challenge.isSubmitted) {
                        if (!confirm("Are you sure you want to leave this page?")) {
                            event.preventDefault();
                        }
                        else {
                            pgCall.callPostService('/private/updateCode', {
                                userId: $rootScope.user.uid,
                                challengeid: $scope.challenge.bucket_challenge,
                                code: $scope.challenge.code,
                                code_language:$scope.challenge.code_language,
                                solution:$scope.challenge.solution
                            });
                        }
                    }
                });
                console.log($scope.challenge);
            }
            else {
                $location.url('/dashboard');
            }

        });
    }


    $scope.updateLanguage = function() {
        if($scope.challenge.code_language == 'Java') {
            $scope.challenge.code = $scope.challenge.starter_code_java;
        }
        else if($scope.challenge.code_language == 'C'){
            $scope.challenge.code = $scope.challenge.starter_code_c;
        }
        else {
            $scope.challenge.code = $scope.challenge.starter_code_cpp;
        }
    };

    $scope.compile = function () {
        if($scope.challenge.batch == $scope.challenge.counter) {
            $scope.testCase = {testCase1: false, testCase2: false};
            internalCall.compileCode({
                code: $scope.challenge.code,
                input: $scope.input,
                lang: $scope.challenge.code_language
            }).
                success(function (data, status, headers, config) {
                    $scope.result = data;
                    console.log(data);
                    if(typeof data.error != 'undefined') {
                        ngToast.create({
                            className: 'danger',
                            content: 'Compilation fail..',
                            timeout: 2000
                        });
                    }
                    else {
                        pgCall.callPostService('/private/updatePath', {
                            userId: $rootScope.user.uid,
                            challengeid: $scope.challenge.bucket_challenge,
                            path: $scope.result.path,
                            code: $scope.challenge.code
                        }).success(function (response) {
                            console.log(response);
                            $scope.challenge.folder = $scope.result.path;
                            ngToast.create({
                                className: 'success',
                                content: 'Compiled Successfully..',
                                timeout: 2000
                            });

                            //notify({ message:'Compiled Successfully..', position:'right'});
                        });
                    }
                }).
                error(function (data, status, headers, config) {
                    $scope.result = 'Error!';
                    console.log('Error');
                    console.log(data);
                });
        }
    };

    function submitCodeAfterTest() {
        if($scope.testCase.testCase1 && $scope.testCase.testCase2 && $scope.testCase.testCase3 && $scope.testCase.testCase4) {
            internalCall.submitCode({userId:$rootScope.user.uid,
                bucket_challenge_id:$scope.challenge.bucket_challenge,
                challengeid:$scope.challenge.challengeId}).success(function(response){
                console.log(response);
                loadChallenge();
                ngToast.create({
                        className: 'success',
                        content: '<i class="fa fa-smile-o"></i> Submitted your code.',
                        timeout:2000
                });
            });
        }
    }
    $scope.submitSolution = function() {
        pgCall.callPostService('/private/submitSolution',{userId:$rootScope.user.uid,
            challengeid:$scope.challenge.bucket_challenge,
            solution:$scope.challenge.solution,option:$scope.challenge.correctOption}).success(function(response){
            loadChallenge();
        });
    };
    $scope.submitCode = function() {
        if(!$scope.challenge.isSubmitted) {

            internalCall.testCode({
                path: $scope.challenge.folder,
                input: $scope.challenge.testCase3,
                lang: $scope.challenge.code_language
            }).success(function (data, status, headers, config) {
                //$scope.result = data;
                console.log(data);
                if ($scope.challenge.result3 == data.output) {
                    $scope.testCase.testCase3 = true;

                    ngToast.create({
                        className: 'success',
                        content: '<span class="glyphicon glyphicon-ok-circle"></span> Test case 3 successful.',
                        timeout: 2000
                    });
                    internalCall.testCode({
                        path: $scope.challenge.folder,
                        input: $scope.challenge.testCase4,
                        lang: $scope.challenge.code_language
                    }).success(function (data, status, headers, config) {
                        //$scope.result = data;
                        console.log(data);
                        if ($scope.challenge.result4 == data.output) {
                            $scope.testCase.testCase4 = true;

                            ngToast.create({
                                className: 'success',
                                content: '<span class="glyphicon glyphicon-ok-circle"></span> Test case 4 successful.',
                                timeout: 2000
                            });
                            submitCodeAfterTest();
                        }
                        else {
                            $scope.testCase.testCase4 = false;

                            ngToast.create({
                                className: 'danger',
                                content: '<span class="glyphicon glyphicon-remove-circle"></span> Test case 4 fail.',
                                timeout: 2000
                            });
                        }
                    });
                }
                else {
                    $scope.testCase.testCase3 = false;

                    ngToast.create({
                        className: 'danger',
                        content: '<span class="glyphicon glyphicon-remove-circle"></span> Test case 3 fail.',
                        timeout: 2000
                    });
                }
            });
        }
    };

    $scope.test = function () {
        if($scope.input == '' || $scope.input == null) {
            alert('Select any test case..')
        }
        else {
            var testCase = '';
            if($scope.input == 'case1') {
                testCase = $scope.challenge.testCase1;
            }
            else {
                testCase = $scope.challenge.testCase2;
            }
            internalCall.testCode({
                path: $scope.challenge.folder,
                input: testCase,
                lang: $scope.challenge.code_language
            }).
                success(function (data, status, headers, config) {
                    $scope.result = data;
                    console.log(data);
                    if($scope.input == 'case1' && $scope.challenge.result1 == data.output) {
                        ngToast.create({
                            className: 'success',
                            content: '<span class="glyphicon glyphicon-ok-circle"></span> Test case 1 successful.',
                            timeout:2000
                        });
                        $scope.testCase.testCase1 = true;
                    }
                    else if($scope.input == 'case2' && $scope.challenge.result2 == data.output) {
                        ngToast.create({
                            className: 'success',
                            content: '<span class="glyphicon glyphicon-ok-circle"></span> Test case 2 successful.',
                            timeout:2000
                        });
                        $scope.testCase.testCase2 = true;
                    }
                    else {
                        ngToast.create({
                            className: 'danger',
                            content: '<span class="glyphicon glyphicon-remove-circle"></span> Test case fail.',
                            timeout: 2000
                        });
                    }
                }).
                error(function (data, status, headers, config) {
                    $scope.result = 'Error!';
                    console.log('Error');
                    console.log(data);
                });
        }
    };
    $scope.$on('$destroy', function() {
        window.onbeforeunload = undefined;
    });

  })
app.controller('loginCtr', function ($scope,$rootScope, $http,$location) {
        $scope.user = {};

        $scope.errorMessage = '';

        $scope.enterLogin=function(event){
            if(event.keyCode==13){
                $scope.login();
            }
        }

        // Register the login() function
        $scope.login = function(){
            //alert('ok');
            $http.post('/login', {
                username: $scope.user.username,
                password: $scope.user.password,
            })
                .success(function(user){
                    // No error: authentication OK
                    console.log(user);
                    if(user.message) {
                        $scope.errorMessage = user.message;
                    }
                    else {
                        user.photoLink = "http://www.topcoder.com"+user.photoLink;
                        $rootScope.user = user;
                        $location.url('/dashboard');
                    }
                })
                .error(function(){
                    // Error: authentication failed
                    $rootScope.message = 'Authentication failed.';
                    //$location.url('/login');
                });
        };

  });
app.controller('homeCtr', function ($scope,$rootScope,$location,externalCall) {
        $scope.init = function() {
            externalCall.callGetService('/getUserDetail').success(function(response){
                //console.log(response);
                if(typeof response.photoLink == "undefined") {
                    $rootScope.user = null;
                }
                else {
                    response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                    $rootScope.user = response;
                    console.log($rootScope.user);
                    $location.url('/dashboard');
                }
            });
        }
    });
app.controller('fullStatCtr', function ($scope,$rootScope,$location,fullStat) {
        $scope.fullStat;
        $scope.init = function() {
            fullStat.makeCall().success(function(response){

                console.log(response);
                $scope.fullStat = response;
            })
        }
    });
app.controller('dashboardCtr', function ($scope,$rootScope,$location,$interval,externalCall,pgCall,socket,ngToast) {

        $scope.stop =  null;
        $scope.buckets = [];

        $scope.init = function() {
            externalCall.callGetService('/getUserDetail').success(function(response){
                //console.log(response);
                if(typeof response.photoLink == "undefined") {
                    $rootScope.user = null;
                    $location.url('/');
                }
                else {
                    response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                    $rootScope.user = response;
                    console.log($rootScope.user);
                    viewLoad();
                }
            });
        }


        socket.on('connected', function (data) {
            socket.emit('ready for updateuser update', {});
            socket.emit('ready for bucket update', {});
        });

        socket.on('updateuser', function (data) {
            console.log(data);
            //notify({ message:'Updating view..', position:'right'});
            viewLoad();
        });

        socket.on('bucketupdate', function (data) {
            console.log(data);
            viewLoad();
        });
        $scope.$on('timer-stopped', function (event, data){
            console.log('Timer Stopped - data = ', data);
            viewLoad();
        });


        function addMinutes(date, minutes) {
            return new Date(date.getTime() + minutes*60000);
        }

        function viewLoad() {
            pgCall.callGetService('/private/viewLoad?userId='+$rootScope.user.uid).success(function(response){
                console.log(response);
                for(var i = 0;i<response.length;i++) {
                    if(response[i].timestamp != null) {
                        response[i].counter = addMinutes(new Date(response[i].timestamp), response[i].timer).getTime() - new Date().getTime();
                        console.log(response[i].counter);
                        if(response[i].counter > 0) {
                            response[i].counter = Math.round(Math.abs(response[i].counter / 1000));
                        }
                        else {
                            response[i].counter = 0;
                        }
                        console.log(response[i].counter);
                        console.log(addMinutes(new Date(response[i].timestamp), response[i].timer));
                        console.log(new Date(response[i].timestamp));
                    }
                    else {
                        response[i].counter = 0;
                    }
                }
                $scope.buckets = response;
            });
        }

        $scope.getToken = function(bucketId) {
            $interval.cancel($scope.stop);
            pgCall.callPostService('/private/register',{uid:$rootScope.user.uid,name:$rootScope.user.name,handle:$rootScope.user.handle,bucketId:bucketId}).success(function(response){
                console.log(response);
                viewLoad();
            });
        }

    });

app.controller('menuCtr', function($scope,$http,$location,$rootScope,externalCall) {
        $scope.init = function() {

        }

        $scope.isActive = function(route) {
            return route === $location.path();
        }
        $scope.logout = function(){
            //alert('ok');
            $http.get('/logout').success(function(user){
                // No error: authentication OK
                //$rootScope.message = 'Authentication successful!';
                $rootScope.user = null;
                $location.url('/');
            })

        };
    });
app.controller('usersCtr', function ($scope,$rootScope,$location,externalCall,pgCall) {
    $scope.init = function() {
        externalCall.callGetService('/getUserDetail').success(function(response){
            //console.log(response);
            if(typeof response.photoLink == "undefined") {
                $rootScope.user = null;
                $location.url('/');
            }
            else {
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
                loadUsers();
            }
        });
    }
    function loadUsers() {
        pgCall.callGetService('/admin/viewUsers').success(function(response){
            $scope.users = response;
            console.log($scope.users);
        })
    }
    $scope.users = [];

    $scope.saveUser = function(data, id) {
        //$scope.user not updated yet
        angular.extend(data, {id: id});
        console.log(data);
        pgCall.callPostService('/admin/updateUser',data).success(function(response){
            console.log(response);
            loadUsers();
        });
    };

    // remove user
    $scope.removeUser = function(id) {
        pgCall.callPostService('/admin/removeUser',{id:id}).success(function(response){

            loadUsers();
        });
    };
});
app.controller('bucketCtr', function ($scope,$rootScope,$location,externalCall,pgCall,ngToast,socket) {

    function addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes*60000);
    }

    $scope.init = function() {
        externalCall.callGetService('/getUserDetail').success(function(response){
            //console.log(response);
            if(typeof response.photoLink == "undefined") {
                $rootScope.user = null;
                $location.url('/');
            }
            else {
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
                loadBuckets();
            }
        });
    }
    function loadBuckets() {
        pgCall.callGetService('/admin/viewBuckets').success(function(response){

            for(var i = 0;i<response.length;i++) {
                if(response[i].timestamp != null) {
                    response[i].counter = addMinutes(new Date(response[i].timestamp), response[i].timer).getTime() - new Date().getTime();
                    console.log(response[i].counter);
                    if(response[i].counter > 0) {
                        response[i].counter = Math.abs(response[i].counter / 1000);
                    }
                    else {
                        response[i].counter = 0;
                    }
                    console.log(response[i].counter);
                    console.log(addMinutes(new Date(response[i].timestamp), response[i].timer));
                    console.log(new Date(response[i].timestamp));
                }
                else {
                    response[i].counter = 0;
                }
            }
            $scope.buckets = response;
            console.log($scope.buckets);
        });
    }
    $scope.buckets = [];

    $scope.saveBucket = function(data, id) {
        //$scope.user not updated yet
        angular.extend(data, {id: id});
        console.log(data);
        pgCall.callPostService('/admin/updateBucket',data).success(function(response){
            loadBuckets();
        });
    };
    $scope.nextCounter = function(id,counter,teamSize) {
        counter++;

        pgCall.callGetService('/admin/getRandomChallenge?bucketId='+id).success(function(response){
            if(typeof response.status === 'undefined') {
                console.log(response);
                pgCall.callPostService('/admin/nextCounter', {
                    id: id,
                    counter: counter,
                    teamSize: teamSize,
                    challengeId: response[0].id,
                }).success(function (response) {
                    loadBuckets();
                });
            }
            else {
                ngToast.create({
                    className: 'warning',
                    content: response.status,
                    timeout:2000
                });
            }
        });
    };

    // remove user
    $scope.removeBucket = function(id) {
        pgCall.callPostService('/admin/removeBucket',{id:id}).success(function(response){
            loadBuckets();
        });
    };

    $scope.type = [
        {value: 'Code', text: 'Code'},
        {value: 'SQL', text: 'SQL'},
        {value: 'Quiz', text: 'Quiz'}
    ];
});
app.controller('winnersCtr', function ($scope,$rootScope,$location,externalCall,pgCall) {
    $scope.init = function() {
        if(typeof $rootScope.user === "undefined") {
            externalCall.callGetService('/getUserDetail').success(function(response){
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
            });
        }
        loadChallenges();
    }
    $scope.buckets = new Object();
    $scope.rounds = new Object();

    $scope.liveData;
    function loadChallenges() {
        pgCall.callGetService('/admin/getWinner').success(function(response){
            $scope.liveData = response;
            $scope.buckets = new Object();
            $scope.rounds = new Object();
            console.log($scope.liveData);
            for(var i = 0; i < $scope.liveData.length; i++) {

                console.log($scope.liveData[i].bucket_id);
                if($scope.buckets[$scope.liveData[i].bucket_id] == null) {
                    $scope.buckets[$scope.liveData[i].bucket_id] = [];
                }
                $scope.buckets[$scope.liveData[i].bucket_id].push($scope.liveData[i]);
            }

            for(var bucketKey in $scope.buckets) {
                var buckets = $scope.buckets[bucketKey];
                $scope.rounds[bucketKey] = new Object();
                for (var j = 0; j < buckets.length; j++) {
                    if ($scope.rounds[bucketKey][buckets[j].bucket_challenge_main_id] == null) {
                        $scope.rounds[bucketKey][buckets[j].bucket_challenge_main_id] = [];
                    }
                    $scope.rounds[bucketKey][buckets[j].bucket_challenge_main_id].push(buckets[j]);
                }
            }
            console.log($scope.buckets);
            console.log($scope.rounds);
        });
    }
});
app.controller('challengesCtr', function ($scope,$rootScope,$location,externalCall,pgCall) {
    $scope.init = function() {
        externalCall.callGetService('/getUserDetail').success(function(response){
            //console.log(response);
            if(typeof response.photoLink == "undefined") {
                $rootScope.user = null;
                $location.url('/');
            }
            else {
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
                loadChallenges();
            }
        });
    }

    function loadChallenges() {
        pgCall.callGetService('/admin/viewBuckets').success(function(response){
            $scope.buckets = response;
            console.log($scope.buckets);
            pgCall.callGetService('/admin/viewChallenges').success(function(response){
                $scope.challenges = response;
                console.log($scope.challenges);
                for(var i= 0; i < $scope.buckets.length; i++) {
                    $scope.buckets[i].challenges = [];
                    for(var j=0; j < $scope.challenges.length; j++) {
                        if($scope.buckets[i].id == $scope.challenges[j].bucketId) {
                            $scope.buckets[i].challenges.push($scope.challenges[j]);
                        }
                    }
                }
                setTimeout(function(){
                    bindTab();
                },500);

            });
        });
    }
    // remove user
    $scope.remove = function(id) {
        pgCall.callPostService('/admin/removeChallenge',{id:id}).success(function(response){
            loadChallenges();
        });
    };
    $scope.challenges = [];
    $scope.buckets = [];
});
app.controller('editchallengesCtr', function ($scope,$rootScope,$location,$routeParams,externalCall,pgCall) {
    $scope.challengeId = $routeParams.id;
    $scope.allowedlanguage = [
        {value: "Java", text: 'Java'},
        {value: "C", text: 'C'},
        {value: "C++", text: 'C++'}
    ];
    $scope.init = function() {

        if(typeof $rootScope.user === "undefined") {
            externalCall.callGetService('/getUserDetail').success(function(response){
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
            });
        }
        loadChallenges();
    }
    function loadChallenges() {
        pgCall.callGetService('/admin/getChallange?id='+$scope.challengeId).success(function(response){
            $scope.challenge = response[0];
            console.log($scope.challenge);
        });
    }
    $scope.challenge;

    $scope.save = function() {
        pgCall.callPostService('/admin/updateChallenge',$scope.challenge).success(function(response){
            console.log(response);
            $location.url('/challenges');
        });
    };
});
app.controller('newchallengesCtr', function ($scope,$rootScope,$location,$routeParams,externalCall,pgCall) {
    $scope.allowedlanguage = [
        {value: "Java", text: 'Java'},
        {value: "C", text: 'C'},
        {value: "C++", text: 'C++'}
    ];
    $scope.init = function() {
        if(typeof $rootScope.user === "undefined") {
            externalCall.callGetService('/getUserDetail').success(function(response){
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
            });
        }

    }

    $scope.challenge;
    $scope.save = function() {
        pgCall.callPostService('/admin/addChallenge',$scope.challenge).success(function(response){
            console.log(response);
            $location.url('/challenges');
        });
    };
});

app.controller('userDescCtr', function ($scope,$rootScope,$location,$routeParams,externalCall,pgCall) {
    $scope.init = function() {
        if(typeof $rootScope.user === "undefined") {
            externalCall.callGetService('/getUserDetail').success(function(response){
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
            });
        }
        loadChallenges();
    }

    $scope.users;
    function loadChallenges() {
        pgCall.callGetService('/admin/getUserDesc?uid='+$routeParams.id).success(function(response){
            $scope.users = response;
            console.log($scope.users);
        });
    }
});
app.controller('helpCtr', function ($scope,$rootScope,$location,$http,$routeParams,externalCall,pgCall) {
    $scope.parsedEntries = [];
    $scope.init = function() {
        var url = 'https://spreadsheets.google.com/feeds/list/1bqbRtqxo5BkqzH2UvRH2Ub_aCCbuZ2NCAxmG27Qsme0/od6/public/values?alt=json'
        var parse = function(entry) {
            var title = entry['gsx$title']['$t'];
            var description = entry['gsx$description']['$t'];

            return {
                description: description,
                title: title
            };
        }
        $http.get(url)
            .success(function(response) {

                var entries = response['feed']['entry'];
                console.log(entries);
                $scope.parsedEntries = [];
                for (var key in entries) {
                    var content = entries[key];
                    $scope.parsedEntries.push(parse(content));
                }
                console.log($scope.parsedEntries);
            });
    };
});
app.controller('liveCtr', function ($scope,$rootScope,$location,$routeParams,externalCall,pgCall) {
    $scope.init = function() {
        if(typeof $rootScope.user === "undefined") {
            externalCall.callGetService('/getUserDetail').success(function(response){
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
            });
        }
        loadChallenges();
    }
    $scope.buckets = new Object();
    $scope.rounds = new Object();

    $scope.liveData;
    function loadChallenges() {
        pgCall.callGetService('/admin/getLiveData').success(function(response){
            $scope.liveData = response;
            console.log($scope.liveData);
            for(var i = 0; i < $scope.liveData.length; i++) {

                console.log($scope.liveData[i].bucketId);
                if($scope.buckets[$scope.liveData[i].bucketId] == null) {
                    $scope.buckets[$scope.liveData[i].bucketId] = [];
                }
                $scope.buckets[$scope.liveData[i].bucketId].push($scope.liveData[i]);
            }

            for(var bucketKey in $scope.buckets) {
                var buckets = $scope.buckets[bucketKey];
                $scope.rounds[bucketKey] = new Object();
                for (var j = 0; j < buckets.length; j++) {
                    if ($scope.rounds[bucketKey][buckets[j].bucket_challenge_id] == null) {
                        $scope.rounds[bucketKey][buckets[j].bucket_challenge_id] = [];
                    }
                    $scope.rounds[bucketKey][buckets[j].bucket_challenge_id].push(buckets[j]);
                }
            }
            console.log($scope.buckets);
            console.log($scope.rounds);
        });
    }
});
app.controller('liveAllCtr', function ($scope,$rootScope,$location,$routeParams,externalCall,pgCall) {
    $scope.init = function() {
        if(typeof $rootScope.user === "undefined") {
            externalCall.callGetService('/getUserDetail').success(function(response){
                response.photoLink = "http://www.topcoder.com" + (response.photoLink == '' || response.photoLink == null ? '/wp-content/themes/tcs-responsive/i/default-photo.png':response.photoLink);
                $rootScope.user = response;
                console.log($rootScope.user);
            });
        }
        loadChallenges();
    }
    $scope.buckets = new Object();
    $scope.rounds = new Object();

    $scope.liveData;
    function loadChallenges() {
        pgCall.callGetService('/admin/getLiveAllData').success(function(response){
            $scope.liveData = response;
            $scope.buckets = new Object();
            $scope.rounds = new Object();
            console.log($scope.liveData);
            for(var i = 0; i < $scope.liveData.length; i++) {

                console.log($scope.liveData[i].bucket_id);
                if($scope.buckets[$scope.liveData[i].bucket_id] == null) {
                    $scope.buckets[$scope.liveData[i].bucket_id] = [];
                }
                $scope.buckets[$scope.liveData[i].bucket_id].push($scope.liveData[i]);
            }

            for(var bucketKey in $scope.buckets) {
                var buckets = $scope.buckets[bucketKey];
                $scope.rounds[bucketKey] = new Object();
                for (var j = 0; j < buckets.length; j++) {
                    if ($scope.rounds[bucketKey][buckets[j].bucket_challenge_main_id] == null) {
                        $scope.rounds[bucketKey][buckets[j].bucket_challenge_main_id] = [];
                    }
                    $scope.rounds[bucketKey][buckets[j].bucket_challenge_main_id].push(buckets[j]);
                }
            }
            console.log($scope.buckets);
            console.log($scope.rounds);
        });
    }
    $scope.setWinner = function(id,status) {
        pgCall.callPostService('/admin/setWinner',{id:id,status:status}).success(function(response){
            loadChallenges();
        });
    };
});