angular.module("ALApp")
.service("strategyService", function(modelService){
	var self = this;
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
this.strategies = [
{id:0,
name:"Buy and hold", 
description:"On the first trading day, buy into the market and stay in. This is the benchmark for the platitude 'Time in the market...'",
riskRating:5,
returnRating:5,
buyTrigger : function(tick, sim, tEvents){return true;},
sellTrigger : function(tick, sim, tEvents){return false;}},
		   
{id:1,
name:"Trade 10% off 12 mo crest/trough", 
description:"Sell when the market is above 110% vs TTM trough and the TTM trough is more recent than TTM peak. Buy when the market is below 90% vs TTM peak and the TTM peak is more recent than the TTM trough.",
rating:1,
buyTrigger : function(tick, sim, tEvents){
	if(tick == sim.firstTick) return true; //Buy in on the first day
	//Find the local minima in the past 12 months
	var ttmLowTick = tEvents.findMinimaSince(new Date(tick.date).setYear(tick.date.getFullYear()-1));
	var ttmHighTick = tEvents.findMaximaSince(new Date(tick.date).setYear(tick.date.getFullYear()-1));
	var lastSaleTick = sim.holdingPeriods[sim.holdingPeriods.length-1].saleTick;
	
	//Buy if todays close is > 10% greater than last sale
	if(tick.adjClose > (lastSaleTick.adjClose * 1.10)) 
		return true;
	
	if(ttmLowTick.date > ttmHighTick.date){
		//Lowdate is more recent; the index is rising off a low
		return (tick.adjClose > (ttmLowTick.adjClose * 1.10)); 
		//return true if todays close is > 10% higher than local minima close
	}
	//Market is falling off a high. Do not buy
	return false;
},
sellTrigger : function(tick,  sim, tEvents){
	var ttmHighTick = tEvents.findMaximaSince(new Date(tick.date).setYear(tick.date.getFullYear()-1));
	var ttmLowTick = tEvents.findMinimaSince(new Date(tick.date).setYear(tick.date.getFullYear()-1));
	var buyTick = sim.holdingPeriods[sim.holdingPeriods.length-1].buyTick;
	
	//Sell if todays close is > 10% lower than purchase
	if(tick.adjClose < (buyTick.adjClose * 0.90)) 
		return true;
	if(ttmLowTick.date < ttmHighTick.date){
		//Highdate is more recent; the index is falling off a high
		//return true if todays close is > 10% higher than local minima close
		
		return (tick.adjClose < (ttmHighTick.adjClose * 0.90)); 
	}
	//Market is rising off a low. Do not sell
	return false;
}},
			
{id:2,
name:"Sell in May and go away", 
description:"Liquidate holdings in May and take a summer vacation from the markets. When November rolls around, buy back in.",
riskRating:4,
returnRating:5,
buyTrigger : function(tick, sim, tEvents){
	//Buy when November comes around
	return (tick.date.getMonth() == 10); //Nov = 10
},
sellTrigger : function(tick, sim, tEvents){
	//Sell in May
	return (tick.date.getMonth() == 4); //May = 4
}},
		
{id:3,
name:"I hate October", 
description:"Sell in October. Buy any other month",
riskRating:2,
returnRating:5,
buyTrigger : function(tick, sim, tEvents){
	//Not October? Everyone in the pool!
	return (tick.date.getMonth() != 9); //Oct = 9
},
sellTrigger : function(tick, sim, tEvents){
	//Is it October? Run for the hills!
	return (tick.date.getMonth() == 9);
}},
		
{id:4,
name:"Sell high PE", 
description:"When the trailing twelve mont price-earnings ratio exceeds 32, exit the market. Buy in again when the PE falls below 32.",
riskRating:2,
returnRating:5,
buyTrigger : function(tick, sim, tEvents){
	return (tick.ttmPE < 32);
},
sellTrigger : function(tick, sim, tEvents){
	return (tick.ttmPE >= 32);
}}
];
}); 