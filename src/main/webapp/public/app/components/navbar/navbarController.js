angular.module("ALApp")
.controller("NavCtrl", function($scope, $rootScope, $location, $route, $timeout, tutorialService){
	
	//When the user flips pages, reset the tutorial step to the first in sequence
	$rootScope.$on("$locationChangeStart", function(event, next, current) { 
		tutorialService.step = 0;
		
		//If the destination is dashboard, then present the "new user" popup bubble
		//for about 8 seconds. After time has elapsed, firstTimeInDashboard becomes
		//falsey
		if($location.path() == "/dashboard" && tutorialService.welcomeBubble.isFirstTimeInDashboard){
			tutorialService.welcomeBubble.isPresentingNewUserBubble = true;
			tutorialService.welcomeBubble.isFirstTimeInDashboard = false;
			$scope.newUserTimeoutPromise = $timeout(function(){
				tutorialService.welcomeBubble.isPresentingNewUserBubble = false;
			}, tutorialService.welcomeBubble.bubbleDuration);
		}
	});
	$scope.$route = $route;
	$scope.$location = $location;
	$scope.homeURL = {url:"."};
	$scope.tutorialService = tutorialService;
});