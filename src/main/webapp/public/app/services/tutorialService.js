angular.module("ALApp")
.service("tutorialService", function($location, $route, $sce){
	var self = this;
	
	/************************************************************
	 * On user's first time navigation to dashboard, present the 
	 * "looks like you're new here" bubble
	 ************************************************************/
	this.welcomeBubble = {
		url:"app/components/tutorial/basicTemplate.html",
		isFirstTimeInDashboard : true,
		isPresentingNewUserBubble : false,
		bubbleDuration: 12000, //Milliseconds
		message :""
	};
	
	/************************************************************
	 * Designates whether the user has activated tutorial or not
	 ************************************************************/
	this.isTutorialActive = false;
	/************************************
	 * The current step of the tutorial
	 ************************************/
	this.step = 0;
	/************************************
	 * The current step of the tutorial
	 ************************************/
	this.template = {url:"app/components/tutorial/tutorialTemplate.html"};
	
	/**********************************************
	 * NavMenu button click event callback
	 * Toggle state of "isTutorialActive"
	 **********************************************/
	this.tutorialButtonClick = function(){
		self.isTutorialActive = !self.isTutorialActive;
	}
	
	/**********************************************
	 * This method controls which popover is open
	 **********************************************/
	this.isPopoverOpen = function(popoverIdx){
		return (self.isTutorialActive && self.step == popoverIdx);
	}
	/******************************************************
	 * Returns the current active popover data object
	 ******************************************************/
	this.getPData = function(){
		var arr = self.getCurrentArray();
		return (arr.length > self.step)?arr[self.step]:null;
	}
	/******************************************************
	 * Returns true if there are more steps left after the
	 * current one
	 ******************************************************/
	this.hasNext = function(){
		return (self.getCurrentArray().length-1 > self.step);
	}
	this.next = function(){ self.step++;}
	/******************************************************
	 * Returns true if the current tutorial step is not 
	 * the first
	 ******************************************************/
	this.hasPrevious = function(){
		return (self.step > 0);
	}
	this.previous = function(){ self.step--;}
	/******************************************************
	 * Returns the active popover array
	 ******************************************************/
	this.getCurrentArray = function(){
		var activeArray = [];
		switch($location.path()){
			case '/dashboard': activeArray = self.dashboardPopovers; break;
			case '/landing': activeArray = self.landingPopovers; break;
			case '/': activeArray = self.landingPopovers; break;
			case '/laboratory': activeArray = self.laboratoryPopovers; break;
		}
		return activeArray;
	}
	
	/******************************************************
	 * Arrays of popover data objects
	 ******************************************************/
	this.landingPopovers = [
	{id:0, position:"top", title:"Tutorial: Onward to the dashboard!", body:$sce.trustAsHtml("This tutorial will walk you through some of the features of our site. Press this big friendly 'Get Started!' button to proceed.")}];
	this.dashboardPopovers = [
	{id:0, position:"bottom", title:"Tutorial: All about the simulations", body:$sce.trustAsHtml("This is the simulation panel. This panel contains the options for running simulations and viewing the detailed results of each sim. Let's take a closer look...")},
	{id:1, position:"right-top", title:"Tutorial: Customize exciting simulations", body:$sce.trustAsHtml("You will find many options to customize the simulation runs under the parameters tab. Since Alpha Sim Lab is all about understanding the effects of time upon your entry and exit strategies, we never want to run just <b>one</b> simulation. That would be quite uninteresting. Instead we execute a whole bunch at once, starting them at staggered intervals!")},
	{id:2, position:"bottom", title:"Tutorial: See detailed results", body:$sce.trustAsHtml("After your collection of simulations have completed, the results of each simulation is listed as a row under the 'simulation results' tab. You can click on any row in the table to display it on the main dashboard! If you click on the magnifying glass icon (<span class='glyphicon glyphicon-search' aria-hidden='true'></span>), you can see even more detailed results about how each transaction went down.")},
	{id:3, position:"bottom", title:"Tutorial: Inspect individual simulations", body:$sce.trustAsHtml("This is the main dashboard where you can inspect the entry and exit activities of your individual simulations. This is a great plact to find out if your strategy is performing as expected, and analyze whether there is room for improvement.")},
	{id:4, position:"top", title:"Tutorial: Change perspective", body:$sce.trustAsHtml("This row of buttons across the bottom of the simulation dashboard lets you change the metrics that are plotted on the main chart.")},
	{id:5, position:"bottom", title:"Tutorial: Comparing strategies", body:$sce.trustAsHtml("Here in the breakdown panel you can view the aggregate performance of all of your simulations together. The trading strategy results are listed in the lefthand column, and the baseline strategy results are in the righthand column so that you can observe how they relate side-by-side.")},
	{id:6, position:"top", title:"Tutorial: Inspecting the CAGR part 1", body:$sce.trustAsHtml("This scatterplot shows the compound annual growth rate of each simulation as a dot. The green dots indicate the trading strategy, and the red dots indicate the selected baseline. A large vertical spread means that the returns on the strategy are highly variable depending on the timing of your entry and exit. A compact vertical spread means that the strategy returns consistent results without regard to timing.")},
	{id:7, position:"top", title:"Tutorial: Inspecting the CAGR part 2", body:$sce.trustAsHtml("The date button lets your rearrange the CAGR scatterplot by simulation ending date. Here you can see trends in the performance of simulations over time. Consistent smooth large uptrends and downtrends suggest that the start and finish dates can make a big difference to the returns of the strategy. Erratic motion or a narrow vertical spread suggests that the start and finish dates take a backseat compared to other factors.")},
	{id:8, position:"top", title:"Tutorial: Terminal values histograms", body:$sce.trustAsHtml("The two histograms on the right show you how many simulations netted ranges of money. A small number of tightly grouped bars indicates that the strategy consistently generates a narrow band of returns. A spread of bars horizontally means that the strategy may have higher variability and potentially higher risk. Bars on the far right are super lucky!")}];
	this.laboratoryPopovers = [
    {id:0, position:"bottom", title:"Tutorial: About the Laboratory", body:$sce.trustAsHtml("This table lists all of the available holding strategies, alongside the author-defined risk and return ratings for each strategy. You can click on a strategy in this table to view its description and implementation details in the center panel.")},
   	{id:1, position:"top", title:"Tutorial: Authoring a new strategy", body:$sce.trustAsHtml("By clicking on the 'Create New Strategy' button, you can create a new holding strategy, which you can then customize to implement your own experimental entry and exit conditions. The new strategy will be selected automatically and appear in the list above.")},
	{id:2, position:"bottom", title:"Tutorial: Observing a strategy", body:$sce.trustAsHtml("The center pane presents the implementation of the strategy that you have selected on the left. Pre-defined strategies cannot be overwritten. New strategies that you have created can be modified, saved, and run.")},
	{id:3, position:"top", title:"Tutorial: Saving a modified strategy", body:$sce.trustAsHtml("After you have modified a strategy implemenation, it is important that you compile and validate the implementation. The below button will check to see whether the modified implementation can compile, and will execute a set of unit test cases to help identify runtime problems.")},
	{id:4, position:"bottom", title:"Tutorial: The API reference", body:$sce.trustAsHtml("While modifying a strategy implementation, it is useful to reference the exposed API objects in the method signature of the buyTrigger and sellTrigger. This pane describes the hierarchy of objects that are exposed for use in the strategy implementation.")}
	];
}); 