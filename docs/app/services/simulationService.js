angular.module("ALApp")
.service("simulationService", function(modelService, strategyService){
	/********************************************************************
	 * SimulationService is a container for the active simulations
	 ********************************************************************/
	var self = this;
	this.status = {
		iteration:1 //numeric iteration
	}
	
	/********************************************************************
	 * strategies is an array of simulation strategy obj
	 * strategyObj = {
	 * id:number
	 * name:string
	 * description:string
	 * buyTrigger:function()
	 * sellTrigger:function()
	 * }
	 ********************************************************************/
	this.strategies = strategyService.strategies;
	
	/********************************************************************
	 * stratBaseline and stratStrategy are the strategies from the array
	 * that the user has selected. Default to "Buy and hold"
	 * 
	 * Each simulation engine will want a different strategy, so they do 
	 * not get bundled with the properties object that is shared
	 ********************************************************************/
	this.stratBaseline = this.strategies[0];
	this.stratStrategy = this.strategies[4];
	
	/********************************************************************
	 * One property set is shared between all simulation engines
	 ********************************************************************/
	this.props = {
		executionFrequency : "year", 
		simulationPeriod : "15", 
		initialMoney : 1000,
		scalarTransactionCost : 3, 
		isDrip : true,
		percentageTransactionCost : 0 //Should be an integer value 0 to 100, not a float
	};
	
	this.baselineESE = new EquitySimulationEngine(this.stratBaseline, this.props); 
	this.strategyESE = new EquitySimulationEngine(this.stratStrategy, this.props);
	
	this.executeSimulations = function(data){
		
		this.baselineESE.strategy = self.stratBaseline;
		this.strategyESE.strategy = self.stratStrategy;
		
		self.baselineESE.runSimulations(data);
		self.strategyESE.runSimulations(data);
		self.status.iteration++;
	}
}); 