angular.module("ALApp")
.service("cpiCalculatorService", function(modelService){
	var self = this;
	self.dollarConversion = function(fromDate, toDate, amount){
		return self.cpiPercentChange(fromDate, toDate) * amount;
	},
	self.cpiPercentChange = function(fromDate, toDate){
		self.cpi = modelService.cpi;
		//Calculate cpi array index for fromDate and toDate (not to be confused with the cpi 1980-calibrated index)
		var fromIdx = ((fromDate.getFullYear() - 1950) * 12) + (fromDate.getMonth());
		var toIdx = ((toDate.getFullYear() - 1950) * 12) + (toDate.getMonth());
		return self.cpi[toIdx].index / self.cpi[fromIdx].index;
	}
}); 