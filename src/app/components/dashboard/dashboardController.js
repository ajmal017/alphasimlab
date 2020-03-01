angular.module("ALApp")
.controller("DashboardCtrl", function($scope, $routeParams, $uibModal, $uibModalStack, $timeout, modelService, simulationService, tutorialService, cpiCalculatorService){
	/* Triggers on initial page load while the controls are populating */
	$scope.initialLoadModal = function(){
		$scope.modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'app/components/dashboard/loadingInitial.html',
			scope:$scope,
			backdrop:'static', //Prevent manual dismiss by clicking
			//controller: 'LoadingCtrl',
			size: 'sm'
		})
	};
	$scope.initialLoadModal(); //Present the modal dialog while the screen 
	$scope.tutorialService = tutorialService;
	$scope.cpiCalculatorService = cpiCalculatorService;
	
	/* Setup activities that are dependent on presence of external data*/
	modelService.dataLoadPromise.then(function(){
		$scope.userSelections = {
			selectedSimRef: null, //Reference to the simulation object that the user has picked in the UI
			selectedSimVisualization: "ordinal" //"enddate","ordinal"
		};
		$scope.modelService = modelService;
		$scope.simulationService = simulationService;
		$scope.yLabel = "Price ($)";
		$scope.uiTabs = [{active:true},{active:false}];
		$scope.progressBar = {
			pct:0,
			type:""
		}
		//After finishing load of the model data, execute a simulation with default values (buy & hold)
		//modelService.dataLoadPromise.then($scope.simulationRefresh);
		
		simulationService.executeSimulations(modelService.data);
		//Auto-pick the first result
		$scope.userSelections.selectedSimRef = $scope.simulationService.strategyESE.simulationsResult[0];
		//$uibModalStack.dismissAll(); //Hide the modal dialog
		$scope.modalInstance.opened.then(function(){
			$scope.modalInstance.dismiss();
		}, function(err){console.dir(err);});
		
		//Click event for table
		$scope.simRowClick = function(simIdx){
			$scope.userSelections.selectedSimRef = $scope.simulationService.strategyESE.simulationsResult[simIdx];
		};
		
		//Ex-post calculation for CPI-adjusted CAGR presentation aggregate on all simulations
		//Externalized from the ESE to avoid a dependency on the CPI data file
		$scope.cpiCAGR = function(ese){
			//Calculate each individual simulation's CPI-adjusted CAGR
			var annCompoundingRateArr = ese.simulationsResult.map(function(sim){
				//Adjust the purchasing power of the ending period amount back to the dollars of the starting period
				var cpiAdjEndingMoney = cpiCalculatorService.dollarConversion(sim.end, sim.start, sim.endingMoney);
				//Calculate the annual compounding rate: r = ln(A/P) / t
				return Math.log(cpiAdjEndingMoney / ese.props.initialMoney) / ese.props.simulationPeriod;
			});
			return math.mean(annCompoundingRateArr);
		}
		
		//Ex-post calculation for CPI-adjusted CAGR presentation for one simulation
		$scope.cpiSimCAGR = function(sim, ese){
			//Adjust the purchasing power of the ending period amount back to the dollars of the starting period
			var cpiAdjEndingMoney = cpiCalculatorService.dollarConversion(sim.end, sim.start, sim.endingMoney);
			//Calculate the annual compounding rate: r = ln(A/P) / t
			return Math.log(cpiAdjEndingMoney / ese.props.initialMoney) / ese.props.simulationPeriod;
		};
	}, function(err){console.dir(err);});
	
	/****************************************************
	 * Call this to recalculate the simulation
	 * Will pop up a modal while sims are running
	 ****************************************************/
	$scope.simulationRefresh = function(){
		$scope.progressBar.pct = 0; //[0,100]
		$scope.progressBar.type = "";
		$scope.modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'app/components/dashboard/loading.html',
			scope:$scope,
			backdrop:'static', //Prevent manual dismiss by clicking
			//controller: 'LoadingCtrl',
			size: 'sm'
		}).rendered.then(function(){
			//Remove the current simulation reference
			$scope.userSelections.selectedSimRef = null;
			
			//All good things come to those who wait
			//Placeholder until we take another stab at moving ese to a webworker
			var simIteration = simulationService.status.iteration
			function makeUserWaitForIt(){
				if($scope.progressBar.pct == 99){
					//Do the work at 99%. Just like the real world
					simulationService.executeSimulations(modelService.data);
					$scope.uiTabs[1].active = true;
				}
				if($scope.progressBar.pct >= 100){
					//Actually make sure it's done by now
					if(simulationService.status.iteration > simIteration){
						//Auto-pick the first result
						$scope.userSelections.selectedSimRef = $scope.simulationService.strategyESE.simulationsResult[0];
						$uibModalStack.dismissAll();
					}else{
						$timeout(makeUserWaitForIt, 20);
					}
				}else{
					if($scope.progressBar.pct == 95){
						$scope.progressBar.type = "success";
					}
					$scope.progressBar.pct++;
					$timeout(makeUserWaitForIt, 10);
				}					
			}
			makeUserWaitForIt();
		});
	};
	$scope.viewSimulationTrades = function(simIdx){
		if(simIdx) $scope.simRowClick(simIdx);
		$scope.modalInstance = $uibModal.open({
			animation: false,
			templateUrl: 'app/components/trades/trades.html',
			scope:$scope,
			//controller: 'TradesCtrl',
			size: 'lg'
		});
	}
});