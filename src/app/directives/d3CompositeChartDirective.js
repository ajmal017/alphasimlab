angular.module("ALApp")
.directive("compositeChart", ['$window', '$filter', function ($window, $filter){
	return {
		restrict: 'E', //Element only
		replace: false, //don't overwrite our directive declaration
		scope: {
			data: '=chartData',
			subSampledData: '=subSampledData',
			field: '=field',
			isLogarithmic: '=logarithmic',
			selectedSim: '=selectedSim'
		},
		link: function (scope, element, attrs) {

			if (!scope.data) {scope.data = [];}
			if(!scope.subSampledData) {scope.subSampledData = [];}
			var subsampleFactor = 5; //Must match factor in modelService used to generate subSampledData
			var margin = {top: 0, right: 0, bottom: 20, left: 0},
				width = element[0].parentElement.clientWidth - margin.left - margin.right - 25,
				height = (parseInt(d3.select(element[0].parentElement).style('width'), 10) / 4) - margin.top - margin.bottom,
				navHeight = (width / 15) - margin.top - margin.bottom;
			
			scope.$watchGroup(["field", "isLogarithmic", "data", "subSampledData", "selectedSim"],function(newValue,oldValue) {
				if (!scope.data) {return;}
				var data = scope.data;
				
				//Pre-calculate min and maxes for both plots
				var minN = d3.min(data, function (d) { return d.date; }),
					maxN = d3.max(data, function (d) { return d.date; });

				var minDate = new Date(minN), // - 8.64e7
					maxDate = new Date(maxN); // + 8.64e7
				var yMin = d3.min(data, function (d) { return d[scope.field]; }),
					yMax = d3.max(scope.data, function(d) { return (d[scope.field]); });
				
				/******************
				 * UPPER VIEW CHART
				 ******************/
				
				//Remove old plot
				d3.select(element[0]).selectAll("*").remove();

				//Define the plot width and height
				var x = d3.time.scale()
					.range([0, width])
					.domain(d3.extent(scope.data, function(d) { return d.date; }));
				var y = null;
				
				//Draw different axes depending on 
				if(!scope.isLogarithmic){
					y = d3.scale.linear().range([height, 0])
						.domain([0, yMax]);
				}else{
					y = d3.scale.log().range([height, 0])
						.base(10)
						.domain([Math.exp(Math.floor(Math.log(yMin))), Math.exp(Math.ceil(Math.log(yMax)))]);
				}
				
				var xAxis = d3.svg.axis()
				    .scale(x)
				    .orient("bottom");
				    //.tickFormat("");
				
				var yAxis = d3.svg.axis()
				    .scale(y)
				    //.tickSize(width)
				    .orient("right")
				    .tickFormat(function (d) {
				        return y.tickFormat(4,d3.format(",d"))(d)
				    });
				
				var area = d3.svg.area()
				    .x(function(d) { return x(d.date); })
				    .y0(height)
				    .y1(function(d) { return y(d[scope.field]); });
	
				var svg = d3.select(element[0]).append("svg")
					    .attr("width", width + margin.left + margin.right)
					    .attr("height", height + margin.top + margin.bottom)
					    .append("g")
					    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
				
				/****************************************
				 * Scenario1: no simulation selected
				 * Render single path 
				 ****************************************/
				svg.append("path")
					.datum(scope.subSampledData)
					.attr("class", "area")
					.attr("d", area);
				
				/****************************************
				 * Scenario2: simulation selected
				 * Render a path for each holding period
				 ****************************************/
				if(scope.selectedSim){
					var hData = []; 
					scope.selectedSim.holdingPeriods.forEach(function(hperiod,hpidx){
						var startIdx = scope.data.indexOf(hperiod.buyTick);
						startIdx += (subsampleFactor - (startIdx%subsampleFactor)); //Find the first subSampledData tick inside the holding period
						var endIdx = scope.data.indexOf(hperiod.saleTick);
						endIdx += (subsampleFactor - endIdx%subsampleFactor); //Find the last subSampledData tick inside the holding period
						//var hData = scope.data.slice(startIdx, endIdx);
						var hData = scope.subSampledData.slice(startIdx/subsampleFactor, endIdx/subsampleFactor);
						var fill = (hperiod.buyTick.adjClose < hperiod.saleTick.adjClose)?"fill: green":"fill: orange";
						svg.append("path")
						.datum(hData)
						.attr("class", "area")
						.attr("style", fill)
						.attr("d", area);
					});
				}
				
				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
				    .call(xAxis);
				
				svg.append("g")
				    .attr("class", "y axis")
				    .call(yAxis);
				
				//Add horizontal lines
				svg.selectAll("g")
			    	.classed("minor", true);

				//Move text "up" so it sits between x-axis lines
				svg.selectAll(".y.axis")
				    .attr("x", 4)
				    .attr("dy", -4);

				/******************
				 * LOWER NAV CHART
				 ******************/
				
				var navChart = d3.select(element[0]).append("svg")
				    .classed('navigator', true)
				    .attr('width', width + margin.left + margin.right)
				    .attr('height', navHeight + margin.top + margin.bottom)
				    .append('g')
				    .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');
				var navXScale = d3.time.scale()
			        .domain([minDate, maxDate])
			        .range([0, width]),
			    navYScale = d3.scale.linear()
			        .domain([yMin, yMax])
			        .range([navHeight, 0]);
				
				var navXAxis = d3.svg.axis()
				    .scale(navXScale)
				    .orient('bottom');
	
				navChart.append('g')
				    .attr('class', 'x axis')
				    .attr('transform', 'translate(0,' + navHeight + ')')
				    .call(navXAxis);
				
				var navData = d3.svg.area()
				    .x(function (d) { return navXScale(d.date); })
				    .y0(navHeight)
				    .y1(function (d) { return navYScale(d[scope.field]); });

				navChart.append('path')
				    .attr('class', 'data')
				    .attr('d', navData(data));

				function redrawChart() {
					svg.selectAll("path.area").attr("d", area);
					svg.selectAll(".transaction").remove();
					renderHoldingPeriods(); //redraw buy/sell lines
				    svg.select('.x.axis').call(xAxis);
				    svg.select('.y.axis').call(yAxis);
				}
				
				function updateViewportFromChart() {
				    if ((x.domain()[0] <= minDate) && (x.domain()[1] >= maxDate)) {
				        viewport.clear();
				        x.domain()[0] = minDate;
				        x.domain()[1] = maxDate;
				    }else{
				        viewport.extent(x.domain());
				    }
				    navChart.select('.viewport').call(viewport);
				}
				
				//Callback from mousewheel zoom event on top chart to scale the lower chart
				function updateZoomFromChart() {
					zoom.x(x);
					var fullDomain = maxDate - minDate,
					    currentDomain = x.domain()[1] - x.domain()[0];
					var minScale = currentDomain / fullDomain,
					    maxScale = minScale * 20;
					zoom.scaleExtent([minScale, maxScale]);
				}
				
				function rescaleYAxis(){
					var dataFiltered = data.filter(function(d, i) {
						if ((d.date >= x.domain()[0]) && (d.date <= x.domain()[1])) {
							return d[scope.field];
						}
					});
					var filteredMax = d3.max(dataFiltered.map(function(d) { return d[scope.field]; }));
					var filteredMin = d3.min(dataFiltered.map(function(d) { return d[scope.field]; }));
					//Rescale the y domain based on extent of the brush
					if(!scope.isLogarithmic){
						y.domain([filteredMin, filteredMax]);
					}else{
						y.domain([Math.exp(Math.floor(Math.log(filteredMin))), Math.exp(Math.ceil(Math.log(filteredMax)))]);
					}
				}
				
				//Define the brush on the lower plot
				var viewport = d3.svg.brush()
				    .x(navXScale)
				    .on("brush", function () {
				        x.domain(viewport.empty() ? navXScale.domain() : viewport.extent());
				        rescaleYAxis();
				        redrawChart();
				    });
				
				//Define the mousewheel zoom behavior
				var zoom = d3.behavior.zoom()
			    .x(x)
			    .on('zoom', function() {
			    	//Shift right if left side would exceed left bound set by mindate
			        if (x.domain()[0] < minDate) {
			        	var lx = zoom.translate()[0] - x(minDate) + x.range()[0];
			            zoom.translate([lx, 0]);
			        } 
			        //Shift left if right side would exceed right bound set by maxdate
			        if (x.domain()[1] > maxDate) {
			        	var lx = zoom.translate()[0] - x(maxDate) + x.range()[1];
			            zoom.translate([lx, 0]);
			        }
			        
			        rescaleYAxis();
			        updateViewportFromChart();
			        redrawChart();
			    });
				
				viewport.on("brushend", function () {
			        updateZoomFromChart();
			    });
				
				var overlay = d3.svg.area()
				    .x(function (d) { return x(d.date); })
				    .y0(0)
				    .y1(height);
				svg.append('path')
				    .attr('class', 'overlay')
				    .attr('d', overlay(data))
				    .call(zoom);
				
				navChart.append("g")
				    .attr("class", "viewport")
				    .call(viewport)
				    .selectAll("rect")
				    .attr("height", navHeight);
				
				/***************************************
				 * Render Viewport if it's been changed
				 ***************************************/
				if(scope.selectedSim){
					//Set the brush scale on the lower plot
					viewport.extent([scope.selectedSim.start, scope.selectedSim.end]);
					//x.domain(viewport.extent());
			        //redrawChart();
					viewport(d3.select(".viewport"));

				    // now fire the brushstart, brushmove, and brushend events
				    // remove transition so just d3.select(".brush") to just draw
					viewport.event(d3.select(".viewport")); //.transition().delay(1000))
				}
				
				
				
				/************************
				 * Render Holding Periods
				 ************************/
				
				renderHoldingPeriods();
				
				function renderHoldingPeriods(){
					if(scope.selectedSim){
						//Build tooltips
						d3.select('body').selectAll(".buy-tip").remove();
						d3.select('body').selectAll(".sell-tip").remove();
						var buytip = d3.tip()
							.attr('class', 'd3-tip buy-tip')
							.offset([-10, 0])
							.html(function(d) {
								var bd = d.buyTick.date;
								return '<table id="tiptable"><tr>'+
								"<td>Buy date: </td><td style='text-align:right'>" + (bd.getMonth() + 1)+'/'+bd.getDate()+'/'+bd.getFullYear() + "</td></tr>"+
								"<td>Buy price: </td><td style='text-align:right'>$" + d.buyTick.adjClose.toFixed(2) + "</td></tr>"+
								"<td>Buy amount: </td><td style='text-align:right'>$" + d.costAmt.toFixed(2)  + "</td></tr>"+
								"</table>";
						});
						var selltip = d3.tip()
							.attr('class', 'd3-tip sell-tip')
							.offset([-10, 0])
							.html(function(d) {
								var sd = d.saleTick.date;
								return '<table id="tiptable"><tr>'+
								"<td>Sell date: </td><td style='text-align:right'>" + (sd.getMonth() + 1)+'/'+sd.getDate()+'/'+sd.getFullYear() + "</td></tr>"+
								"<td>Sell price: </td><td style='text-align:right'>$" + d.saleTick.adjClose.toFixed(2) + "</td></tr>"+
								"<td>Sell amount: </td><td style='text-align:right'>$" + d.saleAmt.toFixed(2) + "</td></tr>"+
								"</table>";
						});
						
						//Bind tooltip
						svg.call(buytip);
						svg.call(selltip);
						
						//Build buy/sell triangles
						var buymarkers = svg.selectAll(".buy")
							.data(scope.selectedSim.holdingPeriods)
							.enter().append("path")
						    .attr("transform", function(d) { return "translate(" + x(d.buyTick.date) + "," + (y(d.buyTick[scope.field]) + 10) + ")"; })
						    .attr("d", d3.svg.symbol().type("triangle-up"))
						    .attr("class", "transaction buy")
						    .on('mouseover', buytip.show)
							.on('mouseout', buytip.hide);
						
						var sellmarkers = svg.selectAll(".sell")
							.data(scope.selectedSim.holdingPeriods)
							.enter().append("path")
						    .attr("transform", function(d) { return "translate(" + x(d.saleTick.date) + "," + (y(d.saleTick[scope.field]) - 10) + ")"; })
						    .attr("d", d3.svg.symbol().type("triangle-down"))
						    .attr("class", "transaction sell")
						    .on('mouseover', selltip.show)
							.on('mouseout', selltip.hide);
						
						//Build holding interval lines
						svg.selectAll(".interval").remove();
						var holdingInterval = svg.selectAll(".interval")
							.data(scope.selectedSim.holdingPeriods)
							.enter();
						
						holdingInterval.append("line")
							.attr("class", "interval")
						    .attr("x1", function(d) { return x(d.buyTick.date);})
						    .attr("x2", function(d) { return x(d.saleTick.date);})
						    .attr("y1", 3)
						    .attr("y2", 3)
						    .attr("style","stroke:rgb(0,0,0);stroke-width:1");
						    
				    	holdingInterval.append("line")
							.attr("class", "interval")
						    .attr("x1", function(d) { return x(d.buyTick.date);})
						    .attr("x2", function(d) { return x(d.buyTick.date);})
						    .attr("y1", 1)
						    .attr("y2", 5)
						    .attr("style","stroke:rgb(0,0,0);stroke-width:1");
				    	
				    	holdingInterval.append("line")
							.attr("class", "interval")
						    .attr("x1", function(d) { return x(d.saleTick.date);})
						    .attr("x2", function(d) { return x(d.saleTick.date);})
						    .attr("y1", 1)
						    .attr("y2", 5)
						    .attr("style","stroke:rgb(0,0,0);stroke-width:1");
				    	
				    	holdingInterval.append("text")
				    		.text(function (d) {
				    			return ((d.saleAmt - d.costAmt) / d.costAmt * 100).toFixed(2) + "%";
				    		})
							.attr("class", "interval interval-text")
						    .attr("x", function(d) { return x(d.buyTick.date);})
						    .attr("y", 14);
						
						/***********************************
						 * Render simulation boundary lines
						 ***********************************/
						svg.selectAll(".simboundary").remove();
						svg.append("line")
							.attr("x1", x(scope.selectedSim.start))
							.attr("x2", x(scope.selectedSim.start))
							.attr("y1", 0)
							.attr("y2", height)
							.attr("class", "simboundary")
							.attr("stroke-dasharray","5,5")
							.attr("style","stroke:black;stroke-width:1;");
						//Label the mean center line
						svg.append("text")
							.text(function (d) { return "Start: " + $filter('date')(scope.selectedSim.start, "MMMM yyyy")})
							.attr("class", "simboundary")
							.attr("transform","translate(" + (x(scope.selectedSim.start)-5) + ", 100) rotate(-90)");
						svg.append("line")
							.attr("x1", x(scope.selectedSim.end))
							.attr("x2", x(scope.selectedSim.end))
							.attr("y1", 0)
							.attr("y2", height)
							.attr("class", "simboundary")
							.attr("stroke-dasharray","5,5")
							.attr("style","stroke:black;stroke-width:1;");
						//Label the mean center line
						svg.append("text")
							.text(function (d) { return "Finish: " + $filter('date')(scope.selectedSim.end, "MMMM yyyy")})
							.attr("class", "simboundary")
							.attr("transform","translate(" + (x(scope.selectedSim.end)-5) + ", 100) rotate(-90)");
					}
				}
			});
		}
	};
}]);