angular.module("ALApp")
.controller("LandingCtrl", function($scope, $location, $timeout, $sce, tutorialService){
	$scope.tutorialService = tutorialService;
	$scope.$location = $location;
	$scope.presentationText = [];
	$scope.headerText=[
		{"text":$sce.trustAsHtml("Will time <span style='color:blue; font-style: italic;'>in</span> the market always outperform tim<span style='color:red;font-style: italic;'>ing</span> the market?")},
		{"text":$sce.trustAsHtml("Do your entry and exit points really matter over the <span style='color:blue; font-style: italic;'>long run</span>?")},
		{"text":$sce.trustAsHtml("Explore the impact of <span style='color:red; font-style: italic;'>time</span> upon your portfolio in the <span class='logo'>AlphaSimLab</span>")}];
	
	var nextItem = 0;
	function presentNext(){
		$scope.presentationText.shift();
		$scope.presentationText.push($scope.headerText[nextItem]);
		nextItem++;
		if(nextItem < $scope.headerText.length){
			$timeout(presentNext, 5500);
		}
	}
	$timeout(presentNext, 1000);
});