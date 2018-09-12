angular.module("ALApp")
.controller("LaboratoryCtrl", function($scope, $uibModal, $location, $sce, strategyService, modelService, simulationService, tutorialService){
	var nextId = 100;
	$scope.tutorialService = tutorialService;
	/* Code editor options */
	$scope.editorOptions = {
		lineWrapping : true,
		lineNumbers: true,
		//theme:'twilight',
		indentWithTabs: true,
		mode: 'javascript',
		viewportMargin:10000
	};
	
	/* Compilation event messages */
	$scope.compileResults = {
		isSuccess : false,
		message : "",
		console : ""
	};
	/* controls which apiReference accordion is open */
//	$scope.accordion = {
//		buyTriggerOpen:true,
//		temporalEventsOpen:false,
//		holdingPeriodOpen:false,
//		simulationOpen:false,
//		tickOpen:false,
//		sellTriggerOpen:false
//	};
	/* Reference to the API documentation HTML */
	$scope.apiReference = {url: "app/components/laboratory/apiReference.html"};
	
	/* Array of all strategies */
	$scope.strategies = strategyService.strategies;
	
	/* Selections made by the user */
	$scope.userSelections = {
		strategy:null,
		buyTriggerMethodText:"",
		sellTriggerMethodText:"",
		hideInstructions:false, //Link in header of instructions panel
		isEditorsDirty:false //True if user has modified contents of either editor
	};
	
	/* Register changes made to code in the editors */
	$scope.$watchGroup(["userSelections.buyTriggerMethodText","userSelections.sellTriggerMethodText"],function(newValue,oldValue) {
		$scope.userSelections.isEditorsDirty = true;
	});
	
	/* User clicked on a row in the lefthand table of strategies */
	$scope.stratRowClick = function(idx){
		if($scope.userSelections.isEditorsDirty){
			//TODO: warn the user that there are unsaved changes
		}
		$scope.userSelections.strategy = $scope.strategies[idx];
		$scope.userSelections.buyTriggerMethodText = "buyTrigger = " + $scope.userSelections.strategy.buyTrigger.toString();
		$scope.userSelections.sellTriggerMethodText = "sellTrigger = " + $scope.userSelections.strategy.sellTrigger.toString();
		$scope.userSelections.isEditorsDirty = false;
	};
	
	/* User clicked on the compile strategy button */
	$scope.compileStrategyClick = function(){
		
		//Reset compilation results
		$scope.compileResults.isSuccess = true;
		$scope.compileResults.message = "";
		$scope.compileResults.console= "";

		//Evaluate buy
		try{
			eval($scope.userSelections.buyTriggerMethodText);
			$scope.userSelections.strategy.buyTrigger = buyTrigger;
		}catch(err){
			console.dir(err);
			$scope.compileResults.isSuccess = false;
			$scope.compileResults.message = $sce.trustAsHtml("There was a " + err.name + " in the buyTrigger compilation: \"" + err.message +"\"");
			$scope.compileResults.console = err.stack;
		}
		//Evaluate sell if buy was successful
		if($scope.compileResults.isSuccess){
			try{
				eval($scope.userSelections.sellTriggerMethodText);
				$scope.userSelections.strategy.sellTrigger = sellTrigger;
			}catch(err){
				console.dir(err);
				$scope.compileResults.isSuccess = false;
				$scope.compileResults.message = $sce.trustAsHtml("There was a " + err.name + " in the buyTrigger compilation: \"" + err.message +"\"");
				$scope.compileResults.console = err.stack;
			}
		}
		//Simulate a simulation execution
		if($scope.compileResults.isSuccess){
			modelService.dataLoadPromise.then(function(){
				try{
					var testbedESE = new EquitySimulationEngine($scope.userSelections.strategy);
					testbedESE.runSimulations(modelService.data);
					$scope.compileResults.message = $sce.trustAsHtml("The buy and sell trigger methods compiled and validated successfully.");
					$scope.compileResults.console = "No errors to report";
				}catch(err){
					console.dir(err);
					$scope.compileResults.isSuccess = false;
					$scope.compileResults.message = $sce.trustAsHtml("There was a " + err.name + " in the buyTrigger compilation: \"" + err.message +"\"");
					$scope.compileResults.console = err.stack;
				}
			});
		}
		
		//Provide compilation status feedback
		$scope.modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'app/components/laboratory/compileFeedback.html',
			scope:$scope,
			size: 'lg'
		})
		
	}
	
	/* User clicked on the Run on dashboard button */
	$scope.sendToDashboard = function(){
		simulationService.stratStrategy = $scope.userSelections.strategy;
		$location.path("dashboard");
	};
	
	/* User clicked on the create new strategy button */
	$scope.newStrategyClick = function(){
		nextId++;
		var freshStrat = {
			id:nextId,
			isEditable:true,
			name:"Awesome new strat " + nextId, 
			description:"",
			rating:0,
buyTrigger : function(tick, simulation, tEvents){
	//TODO: Implement me!
	return true;
},
sellTrigger : function(tick, simulation, tEvents){
	//TODO: Implement me!
	return false;
}
		};
		
		//Add the new strategy to the end of the list
		$scope.strategies.push(freshStrat);
		//Call the rowclick event to select it
		$scope.stratRowClick($scope.strategies.length-1);
	}
});