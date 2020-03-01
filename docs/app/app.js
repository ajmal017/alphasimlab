angular.module("ALApp",["ngRoute","ui.bootstrap", "ui.bootstrap.tabs", "ngAnimate","angular-rpi","ui.codemirror","duScroll"])
.config(['$routeProvider', '$locationProvider', function($routeProvider, $locationProvider){
	$locationProvider.html5Mode({
		enabled: true,
		requireBase: false
	});
	$routeProvider
	.when("/dashboard", {
		templateUrl: "app/components/dashboard/dashboard.html",
		controller: 'DashboardCtrl',
        controllerAs: 'dashboard'
	})
	.when("/about", {
		templateUrl: "app/components/about/about.html",
		controller: 'AboutCtrl',
        controllerAs: 'about'
	})
	.when("/laboratory", {
		templateUrl: "app/components/laboratory/laboratory.html",
		controller: 'LaboratoryCtrl',
        controllerAs: 'laboratory'
	})
	.when("/privacy", {
		templateUrl: "app/components/privacy/privacy.html"
	})
	.when("/unsupported", {
		templateUrl: "app/components/unsupported/unsupported.html"
	})
	.when("/contact", {
		templateUrl: "app/components/contact/contact.html",
		controller: 'ContactCtrl',
        controllerAs: 'contact'
	})
	.otherwise({
		templateUrl: "app/components/landing/landing.html",
		controller: 'LandingCtrl',
        controllerAs: 'landing'
	});
}])
.run(function($location){
	//Check for unsupported browsers and redirect them to where they can get help
	var myNav = navigator.userAgent.toLowerCase();
	var ieVersion = (myNav.indexOf('msie') != -1) ? parseInt(myNav.split('msie')[1]) : false;
	if (ieVersion && ieVersion < 11) {
		$location.path('/unsupported');
	}
	
})
/* Main Navigation */
.controller("primaryCtrl", function($scope, $route, modelService){
	$scope.credentials = modelService.credentials;
	$scope.navBar = {url: "app/components/navbar/navbar.html"};
	$scope.footer = {url: "app/components/footer/footer.html"};
});