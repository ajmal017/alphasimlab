angular.module("ALApp")
.service("modelService", function(fileAjaxService, $q){
	var self = this;
	
	/*******************************************************************
	 * For rendering efficiency, we build a subsampled data array
	 * Setting a factor of 5 means that the subsampled array will
	 * contain 1 in 5 elements
	 ******************************************************************/
	var subsampleFactor = 5;
	
	/*******************************************************************
	 * The name of the file object that contains CPI historical data
	 ******************************************************************/
	this.cpiFileName = "CPI_1980.csv";
	
	/*******************************************************************
	 * The file object that the user has selected in the UI
	 ******************************************************************/
	this.selectedFileName = "SP500_YF.csv";
	
	/*******************************************************************
	 * The name of the data field to plot
	 ******************************************************************/
	this.plotField = "adjClose";
	
	/*******************************************************************
	 * Plot logarathmic or linear
	 ******************************************************************/
	this.plotLogarithmic = false;
	
	/*******************************************************************
	 * Array of equity price data
	 * Reminder: When accessing this property, do so inside the context of
	 * dataLoadPromise.then()
	 * Ex: [{date:Date, open:float, high:float, low:float, close:float, volume:long, adjClose:float}, ... ]
	 ******************************************************************/
	this.data = [];
	
	/*******************************************************************
	 * Array of CPI data (sourced from StLous Fed
	 * Contents are [{date:Date, index:float}, ...]
	 * Index is normalized at 100 = 1980 
	 ******************************************************************/
	this.cpi = [];
	
	/*******************************************************************
	 * Array of equity price data
	 * Data at weekly granularity
	 ******************************************************************/
	this.subSampledData = [];

	/*******************************************
	 * Execute ajax call to fetch index data
	 *******************************************/
	this.reloadData = function(){
		return fileAjaxService.getFile(self.selectedFileName)
		.then(function(response){
			//Empty the array
			self.data.length = 0;
			self.subSampledData.length = 0;
			
			//Split file by line
			response.data.split("\n").forEach(function(val, idx){
				//Split line by field
				var fields = val.split(",",9);
				//Build one object per day
				self.data.push({
					date	: 	new Date(Date.parse(fields[0])),
					open	: 	parseFloat(fields[1]),
					high	: 	parseFloat(fields[2]),
					low		: 	parseFloat(fields[3]),
					close	: 	parseFloat(fields[4]),
					volume	: 	parseInt(fields[5]),
					adjClose: 	parseFloat(fields[6]),
					exDivPPS:	parseFloat(fields[7]),
					ttmPE	:	parseFloat(fields[8])
				});
			});
			//Order file by date
			self.data.sort(function(a,b){
				//return new Date(a.date) - new Date(b.date);
				if (a.date < b.date) return -1;
				if (a.date > b.date) return 1;
				return 0;
			});
			
			//Calculate TTM and summarize weekly data
			var ttma = []; //Keep an array of in-scope values
			var sum = 0;
			self.data.forEach(function(tick, idx){
				ttma.push(tick); //Add this tick
				sum += tick.adjClose; //Sum has the running total
				var lastDate = new Date(tick.date).setYear(tick.date.getFullYear() - 1);
				//Remove items from start of the trailing 12 months array that have passed out of 12 month window 
				while(ttma.length > 0){
					if(ttma[0].date < lastDate){ //remove out-of-scope from array and subtract value from running sum
						sum -= ttma.shift().adjClose;
					}else{ //exit while loop, because the array is sorted in ascending by date; no more out-of-scope dates left to find
						break;
					}
				}
				tick.ttm = sum/ttma.length;
				
				if(idx%subsampleFactor==0){
					self.subSampledData.push(tick);
				}
			});

		}, function(err){console.dir(err);});
	}
	
	/*******************************************
	 * Execute ajax call to fetch CPI
	 *******************************************/
	this.loadCPI = function(){
		return fileAjaxService.getFile(self.cpiFileName)
		.then(function(response){
			self.cpi.length = 0;
			response.data.split("\n").forEach(function(val, idx){
				var fields = val.split(",",2);
				self.cpi.push({
					date	: 	new Date(Date.parse(fields[0])),
					index	: 	parseFloat(fields[1])
				});
			});
			self.data.sort(function(a,b){
				if (a.date < b.date) return -1;
				if (a.date > b.date) return 1;
				return 0;
			});
		}, function(err){console.dir(err);});
	}

	/*******************************************
	 * Eager execute ajax calls to fetch data
	 *******************************************/
	this.dataLoadPromise = $q.all([
		self.reloadData(),
		self.loadCPI()]);
}); 