/**************************************************************
 * Engine to run 1..n day granularity simulations 
 * over a fixed number of years
 * 
 * strategy: [required] contains buy and sell trigger methods
 * props: [optional] contains simulation parameters
 **************************************************************/
function EquitySimulationEngine(strategy, props){
	var self = this;
	this.props = props;
	if(!this.props){
		this.props = {
			/*******************************************************************
			 * How frequently will simulations be executed?
			 * String: ["month"|"quarter"|"year"]
			 ******************************************************************/
			executionFrequency : "year", 
			
			/*******************************************************************
			 * How long does each simulation run?
			 * Number|String(int): years
			 ******************************************************************/
			simulationPeriod : 15, 
			
			/*******************************************************************
			 * How much money does the agent have at start of each sim?
			 * Number|String(float): Dollars
			 ******************************************************************/
			initialMoney : 1000,
			
			/*******************************************************************
			 * Should dividends be reinvested?
			 * Boolean
			 ******************************************************************/
			isDrip : true,
			
			/*******************************************************************
			 * Transaction costs are applied to cost basis on every 
			 * buy and sell trade
			 ******************************************************************/
			scalarTransactionCost : 0, 
			percentageTransactionCost : 0 //Should be an integer value 0 to 100, not a float
		}
	};
	
	//Ensure that transaction costs are numeric types
	this.props.scalarTransactionCost = parseFloat(this.props.scalarTransactionCost);
	this.props.percentageTransactionCost = parseFloat(this.props.percentageTransactionCost);
	
	/*******************************************************************
	 * Contains the above described closures buyTrigger and sellTrigger
	 * {
	 * buyTrigger: Closure (see above)
	 * sellTrigger: Closure (see above)
	 * see simulationService for rest of fields
	 * }
	 ******************************************************************/
	this.strategy = strategy;
	
	/*******************************************************************
	 * Contains events that may be used in the buyTrigger and 
	 * sellTrigger methods
	 ******************************************************************/
	this.temporalEvents = {
		closingMaxima:[], //Sorted array of high-water-mark tick events in reverse order (first element is recent, last element is ancient)
		closingMinima:[], //Sorted array of low-water-mark tick events in reverse order (first element is recent, last element is ancient)
		findMaximaSince:function(since){
			var maxTick = null;
			self.temporalEvents.closingMaxima.some(function(tick){ //iterate backwards in time
				if(tick.date < since) return true; //Stop when we've gone past "since"
				maxTick = tick; //Each historic element further back in time is bigger than the last
			});
			return maxTick;
		},
		findMinimaSince:function(since){
			var minTick = null;
			self.temporalEvents.closingMinima.some(function(tick){ //iterate backwards in time
				if(tick.date < since) return true; //Stop when we've gone past "since"
				minTick = tick; //Each historic element further back in time is smaller than the last
			});
			return minTick;
		}
	};
	
	/*******************************************************************
	 * Read-Only
	 * Array of simulation objects: each object represents one set of 
	 * years in which the trading strategy is executed
	 * 
	 * Simulation Objects array is ordered by start date
	 * HoldingPeriod Objects array is ordered by buy tick
	 * 
	 * Simulation Objects -> 
	 * 	{endingMoney:float, 
	 * 	start:date, //Always a trading day
	 * 	end:date,  //May *not* be a trading day
	 * 	firstTick: objRef, //Ref to tick obj in dataset that is first trading day
	 * 	lastTick: objRef, //Ref to tick obj in dataset that is last trading day 
	 * 	holdingPeriods: array,
	 *  totalFeesPaid: float,
	 *  totalDividends: float,
	 *  annCompoundingRate: float}
	 * 
	 * HoldingPeriod Objects -> 
	 * 	{costAmt:float, 
	 * 	saleAmt:float, 
	 *  shares:float, //Running total of shares owned (used for dividend calculation)
	 *  dividendAmt:float, //Running sum total of dividends
	 * 	buyTick:objRef, 
	 * 	saleTick:objRef,
	 *  totalFeesPaid: float}
	 *  
	 * buyTrigger : function(){return true;},
	 * What triggers a buy?
	 * Closure:
	 * 	params -> object (tick, sim, temporalEvents)
	 * 	return -> boolean (true=buy|false=hold)
	 *
	 * sellTrigger : function(){return true;},
	 * What triggers a sell?
	 * Note: sell ALWAYS triggers on last trading day of simulation
	 * Closure:
	 * 	params -> object (tick, sim, temporalEvents)
	 * 	return -> boolean (true=sell|false=hold)
	 ******************************************************************/
	this.simulationsResult = [];
	this.aggregateResults ={
		meanEndingMoney : 0,
		stdDevEndingMoney : 0,
		medianEndingMoney : 0,
		//% Change
		meanPctChange : 0,
		medianPctChange : 0,
		bestPctChange : 0,
		worstPctChange : 0,
		//Fees & trades
		meanTotalFeesPaid: 0,
		meanTrades: 0,
		//Best/Worst Sim references
		bestEndingMoneySim : null,
		worstEndingMoneySim : null,
		meanAnnCompoundingRate : 0,
		//Note that strategy can be modified via UI
		//Below is a reference to the last strategy employed
		simulationPeriodAtTimeOfRun : null
	};
};


/**********************************************************************
 * Run Simulations
 * 
 * Calculates execution of buy/sell strategy upon entire dataset for
 * staggered timeperiods
 * 
 * data:array (array of data object)
 * callback:function(pctComplete:int) 
 * 	[used for updating parent of status, can be null, gets executed each year]
 **********************************************************************/
EquitySimulationEngine.prototype.runSimulations = function(data){
	self = this;
	//Empty the results array
	self.simulationsResult.splice(0,self.simulationsResult.length);
	
	//Sort the data by date
	//data.sort(function(a,b){
	//	return new Date(a.date) - new Date(b.date);
	//});
	
	//Object reference to the last tick in the data series
	var lastTick = data[data.length-1];
	//Index of the last ended simulation in the simulationsResults array
	//Simulations objects in the array in order of start date, and they all have the same duration
	//so we can use this index to quickly find all the simulations that are still running
	var lastEndedSimResultIdx = -1;
	
	//Is it time to start a new simulation on this tick?
	var nextSimulationStartsOnOrAfter = new Date(data[0].date);
	//console.log("data size: " + data.length + ", nextSimulationStartsOnOrAfter: " + nextSimulationStartsOnOrAfter);
	//Iterate over each tick in the dataset

	//Clear out local minima and local maxima from any previous runs
	self.temporalEvents.closingMinima.length = 0;
	self.temporalEvents.closingMaxima.length = 0;
	
	data.forEach(function(tick, tickIdx){
		var startDate = new Date(tick.date);
		var endDate = new Date(tick.date);
		endDate.setYear(endDate.getFullYear() + parseInt(self.props.simulationPeriod));
		
		//Calculate local maxima
		//Iterate over historical and dump ticks smaller than this one until it finds a bigger one in history
		var continueSearch = true;
		while(self.temporalEvents.closingMaxima.length > 0 && continueSearch){
			if(self.temporalEvents.closingMaxima[0].adjClose < tick.adjClose){
				self.temporalEvents.closingMaxima.shift();
			}else{ continueSearch = false; }
		}
		self.temporalEvents.closingMaxima.unshift(tick); //Add current tick to front of array
		//Calculate local minima
		continueSearch = true;
		while(self.temporalEvents.closingMinima.length > 0 && continueSearch){
			if(self.temporalEvents.closingMinima[0].adjClose > tick.adjClose){
				self.temporalEvents.closingMinima.shift();
			}else{ continueSearch = false; }
		}
		self.temporalEvents.closingMinima.unshift(tick); //Add current tick to front of array

		//Initialize a new simulation period starting on this tick if...
		//1) endDate comes before the end of our series (eg. we have enough data in our dataset to run the entire simulation period)
		//2) tick.date is the first trading date
		if(endDate <= lastTick.date && nextSimulationStartsOnOrAfter <= tick.date){
			
			self.simulationsResult.push({
				endingMoney: 0, 
				start: startDate,
				end: endDate,
				firstTick: tick,
				lastTick: null,
				totalFeesPaid: 0,
				holdingPeriods: []
			});
			//Figure out when to start the next simulation
			switch (self.props.executionFrequency){
				case "month": nextSimulationStartsOnOrAfter.setMonth(nextSimulationStartsOnOrAfter.getMonth() + 1); break;
				case "quarter": nextSimulationStartsOnOrAfter.setMonth(nextSimulationStartsOnOrAfter.getMonth() + 3); break;
				case "year":
				default: nextSimulationStartsOnOrAfter.setYear(nextSimulationStartsOnOrAfter.getFullYear() + 1); 
			}
		}
		//Iterate over all simulations that have not been completed which will live in the last part of the simulations array
		for(var runningSimIdx = (lastEndedSimResultIdx+1); runningSimIdx < self.simulationsResult.length; runningSimIdx++){
			var runningSimObj = self.simulationsResult[runningSimIdx];
			
			//We know that the simulation is in a holding period in the timeframe of the current tick if
			//the last sequential holding period object in the simulation array does not have a saleTick
			var isSimInHoldingPeriod = (!runningSimObj.holdingPeriods.length == 0) && 
				(runningSimObj.holdingPeriods[runningSimObj.holdingPeriods.length-1].saleTick == null);
			
			/**********************************
			 ******** SIM TERMINATION *********
			 **********************************/
			//Determine if the current simulation needs to be ended
			//Either the current tick is later than the sim's scheduled end date
			//Or the current tick is the last tick in the data series
			
			//console.log("isSimNeedingTermination = ( tick.date: " + tick.date + " > runningSimObj.endDate: " + runningSimObj.endDate);
			var isSimNeedingTermination = (tick.date > runningSimObj.end || tickIdx == data.length-1);

			if(isSimNeedingTermination){
				//Note that we don't incur a sale commission if the sale is triggered by the sim termination event
				//If the current tick exceeds the termination date, then it was sold in the previous tick
				//Otherwise if this is the last tick in data series, then it gets sold in this tick
				var liquidateTick = (tickIdx == data.length-1) ? tick : data[tickIdx-1];
				
				//If the simulation is currently holding, then liquidate its position
				if(isSimInHoldingPeriod){
					//Execute sell
					var sellHoldingPeriod = runningSimObj.holdingPeriods[runningSimObj.holdingPeriods.length-1];
					//sellHoldingPeriod.saleAmt = (liquidateTick.adjClose / sellHoldingPeriod.buyTick.adjClose) * sellHoldingPeriod.costAmt;
					sellHoldingPeriod.saleAmt = (liquidateTick.adjClose * sellHoldingPeriod.shares);
					sellHoldingPeriod.saleTick = liquidateTick;
				}
				
				//Compute the sum of the dividends
				runningSimObj.totalDividends = math.sum(runningSimObj.holdingPeriods.map(function(period){return period.dividendAmt;}));
				
				//Final money is the sale amount of the last holding period in the simulation
				if(runningSimObj.holdingPeriods.length > 0){
					runningSimObj.endingMoney = runningSimObj.holdingPeriods[runningSimObj.holdingPeriods.length-1].saleAmt;
					//If dividends were not reinvested, then add the cash amount to the ending total
					if(!self.props.isDrip){
						runningSimObj.endingMoney += runningSimObj.totalDividends;
					}
				}else{ //If the sim never bought in, then it finishes with its starting money
					runningSimObj.endingMoney = self.props.initialMoney;
				}
				runningSimObj.lastTick = liquidateTick;
				lastEndedSimResultIdx = runningSimIdx;
				
				//Calculate the annual compounding rate: r = ln(A/P) / t
				runningSimObj.annCompoundingRate = Math.log(runningSimObj.endingMoney / self.props.initialMoney) / self.props.simulationPeriod;
				
				//Simulation position is now closed out, so skip buy and sell triggers for this final tick
				continue;
			}
			
			/**********************************
			 ********** DIVIDEND **************
			 **********************************/
			//If the simulation is in a holding period, then increment the dividend by the distribution amount
			if(isSimInHoldingPeriod){
				var holdingPeriod = runningSimObj.holdingPeriods[runningSimObj.holdingPeriods.length-1];
				var tickDividendAmt = (holdingPeriod.shares * tick.exDivPPS);
				holdingPeriod.dividendAmt += tickDividendAmt;
				if(self.props.isDrip){
					holdingPeriod.shares += (tickDividendAmt / tick.adjClose);
				}
			}
			
			/**********************************
			 ************* BUY ****************
			 **********************************/
			//If the simulation is not in a holding period, then evaluate buyTrigger
			if(!isSimInHoldingPeriod && self.strategy.buyTrigger(tick, runningSimObj, self.temporalEvents)){
				//How much money does sim have? Either initialMoney or amount of the last sale
				var costAmount = (runningSimObj.holdingPeriods.length > 0) ? 
						runningSimObj.holdingPeriods[runningSimObj.holdingPeriods.length-1].saleAmt :
						parseFloat(self.props.initialMoney);
				
				//Calculate impact of commission
				var commission = self.props.scalarTransactionCost + (costAmount * (self.props.percentageTransactionCost / 100));
				var costAmount = costAmount - commission;
						
				//Execute buy
				runningSimObj.holdingPeriods.push({
					costAmt:costAmount, 
					saleAmt:null,
					shares: (costAmount / tick.adjClose),
					dividendAmt:0,
					buyTick:tick, 
					saleTick:null,
					totalFeesPaid:parseFloat(commission)
				});
				
				//Update simulation running total of fees paid
				runningSimObj.totalFeesPaid += commission;
			}
			
			/**********************************
			 ************* SELL ***************
			 **********************************/
			//If the simulation is in a holding period, then evaluate sellTrigger
			if(isSimInHoldingPeriod && self.strategy.sellTrigger(tick, runningSimObj, self.temporalEvents)){
				//Calculate impact of commission
				var sellHoldingPeriod = runningSimObj.holdingPeriods[runningSimObj.holdingPeriods.length-1];
				//var saleAmount = (tick.adjClose / sellHoldingPeriod.buyTick.adjClose) * sellHoldingPeriod.costAmt;
				var saleAmount = (tick.adjClose * sellHoldingPeriod.shares);
				var commission = self.props.scalarTransactionCost + (saleAmount * (self.props.percentageTransactionCost / 100));
				saleAmount = saleAmount - commission;
				
				//Execute sell
				sellHoldingPeriod.saleAmt = saleAmount;
				sellHoldingPeriod.saleTick = tick;
				sellHoldingPeriod.totalFeesPaid += commission;
				
				//Update simulation running total of fees paid
				runningSimObj.totalFeesPaid += commission;
			}
		}
	});
	
	/**********************************
	 ******** CALC AGGREGATES *********
	 **********************************/
	//Clear aggregates
	self.aggregateResults.bestEndingMoneySim = null;
	self.aggregateResults.worstEndingMoneySim = null;
	self.simulationsResult.forEach(function(simulation, simIdx){
		if(!self.aggregateResults.bestEndingMoneySim || simulation.endingMoney > self.aggregateResults.bestEndingMoneySim.endingMoney)
			self.aggregateResults.bestEndingMoneySim = simulation;
		if(!self.aggregateResults.worstEndingMoneySim || simulation.endingMoney < self.aggregateResults.worstEndingMoneySim.endingMoney)
			self.aggregateResults.worstEndingMoneySim = simulation;
	});
	
	var endingMoneyArr = self.simulationsResult.map(function(sim){return sim.endingMoney;});
	var annCompoundingRateArr = self.simulationsResult.map(function(sim){return sim.annCompoundingRate;});
	//var feesArr = self.simulationsResult.map(function(sim){return sim.meanTotalFeesPaid;});
	var holdingPeriodsArr = self.simulationsResult.map(function(sim){return sim.holdingPeriods.length;});
	
	self.aggregateResults.stdDevEndingMoney = math.std(endingMoneyArr);
	self.aggregateResults.meanEndingMoney = math.mean(endingMoneyArr);
	//self.aggregateResults.medianEndingMoney = math.median(endingMoneyArr);
	//math.median seems to be broken only in IE
	self.aggregateResults.medianEndingMoney = median(endingMoneyArr);
	self.aggregateResults.meanPctChange = (self.aggregateResults.meanEndingMoney * 100 / self.props.initialMoney) - 1;
	self.aggregateResults.medianPctChange = (self.aggregateResults.medianEndingMoney * 100 / self.props.initialMoney) - 1;
	self.aggregateResults.bestPctChange = (self.aggregateResults.bestEndingMoneySim.meanEndingMoney * 100 / self.props.initialMoney) - 1;
	self.aggregateResults.worstPctChange = (self.aggregateResults.worstEndingMoneySim.meanEndingMoney * 100 / self.props.initialMoney) - 1;
	self.aggregateResults.totalFeesPaid = math.sum(self.simulationsResult.map(function(sim){return parseFloat(sim.totalFeesPaid);}));
	
	self.aggregateResults.simulationPeriodAtTimeOfRun = self.props.simulationPeriod
	self.aggregateResults.meanAnnCompoundingRate = math.mean(annCompoundingRateArr);
	
	//self.aggregateResults.meanTotalFeesPaid = math.mean(feesArr);
	self.aggregateResults.meanTrades = math.mean(holdingPeriodsArr) * 2;
};