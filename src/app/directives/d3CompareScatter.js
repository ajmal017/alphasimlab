angular.module("ALApp")
.directive("compareScatter", ['$window', function ($window){
	return {
		restrict: 'E', //Element only
		replace: false, //don't overwrite our directive declaration
		scope: {
			ese1: '=ese1', //Array of simulationsResult object "strategy"
			ese2: '=ese2', //Array of simulationsResult object "baseline"
			axisType: '=axisType', //["enddate","ordinal"]
			renderStatus: '=renderWatch' //variable that gets updated when simulation finishes
		},
		link: function (scope, element, attrs) {
			var margin = {top: 10, right: 10, bottom: 40, left: 20}
			  , width = parseInt(d3.select(element[0].parentElement).style('width'), 10) - 15
			  , width = width - margin.left - margin.right;
			var height = (parseInt(d3.select(element[0].parentElement).style('width'), 10) / 2)

			//Determine the vertical scale min/max depending on which metric is selected
			scope.$watchGroup(["renderStatus","axisType"],function(newValue,oldValue) { //data
				if (scope.ese1 && scope.ese2) {
					//Remove old plot
					d3.select(element[0]).selectAll("*").remove();
					
					//Dot size should scale linearly with the number of dots to plot
					//However, dot size should not be smaller than 1.0 (too hard to see)
					//(1) (51, 3.5) At 51 points, empirically we want radius to be set to 3.5
					//(3) (432, 1.0) At 432 points, empirically we want radius to be set to 1.0
					// Slope => M => (y2-y1) / (x2-x1) = ((1.0-3.5) / (432-51)) = -0.00656
					// y-intercept => y=mx+b => 1.0 = -0.00656 * 432 + B => 1.0 = -2.83392 + B = 3.83392
					var dotRadius = (scope.ese1.simulationsResult.length * -0.00656) + 3.83392;
					if(dotRadius < 1.0) dotRadius = 1.0;
					

					var xScale = null;
					var xAxis = null;
					
					//Calculate the y-axis domain based on max and min results across both result sets
					var yMinESE1 = d3.min(scope.ese1.simulationsResult, function (d) {return d.annCompoundingRate;});
					var yMaxESE1 = d3.max(scope.ese1.simulationsResult, function (d) {return d.annCompoundingRate;});
					var yMinESE2 = d3.min(scope.ese2.simulationsResult, function (d) {return d.annCompoundingRate;});
					var yMaxESE2 = d3.max(scope.ese2.simulationsResult, function (d) {return d.annCompoundingRate;});
					var yMin = Math.floor(((yMinESE1 < yMinESE2)? yMinESE1: yMinESE2) * 100);
					var yMax = Math.ceil(((yMaxESE1 > yMaxESE2)? yMaxESE1: yMaxESE2) * 100);
					
					if(scope.axisType != "ordinal"){
						xScale = d3.time.scale()
							.range([0, width])
							.domain(d3.extent(scope.ese1.simulationsResult, function(d) { return d.end; }));
						xAxis = d3.svg.axis().scale(xScale).orient("bottom")
					    	.innerTickSize(-height)
						    .outerTickSize(0)
						    .tickPadding(10);
					}else{
						xScale = d3.scale.ordinal()
							.range([0, width])
						    .domain([scope.ese1.strategy.name, scope.ese2.strategy.name])
						    .rangePoints([0, width], 1.0);
						xAxis = d3.svg.axis()
						    .scale(xScale)
						    .orient("bottom");
					}
					
					//Function to get x-axis
					var xValue = function(d){
						if(scope.axisType != "ordinal"){
							return xScale(d.end); //Return position of end date
						}else{
							return xScale(scope.ese1.strategy.name);
						}
					};
					
					var yScale = d3.scale.linear().range([height, 0]).domain([yMin, yMax]),
				    	yAxis = d3.svg.axis().scale(yScale).orient("left")
				    	.innerTickSize(-width)
					    .outerTickSize(0)
					    .tickPadding(10);
					
					var svg = d3.select(element[0]).append("svg")
						.attr("width", width + margin.left + margin.right)
						.attr("height", height + margin.top + margin.bottom)
						.append("g")
						.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
					
					//don't want dots overlapping axis, so add in buffer to data domain
					//xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
					//yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);
					//x-axis
					
					svg.append("g")
						.attr("class", "x axis")
						.attr("transform", "translate(0," + height + ")")
						.call(xAxis)
					
					//Add a x-axis label only if axis is end-date
					if(scope.axisType != "ordinal"){
						svg.append("text")
							.attr("class", "xlabel")
							.attr("text-anchor", "middle")
							.attr("x", width / 2)
							.attr("y", height + margin.bottom)
							.text("End Date");
					}
					
					// y-axis
					svg.append("g")
						.attr("class", "y axis")
						.call(yAxis)
					svg.append("text")
						.attr("class", "ylabel")
						.attr("y", 0)
						.attr("x", 0 - (height) - margin.top + 75)
						.attr("dy", "1em")
						.attr("transform", "rotate(-90)")
						.style("text-anchor", "right")
						.text("Annual compounding rate (%)");
					//Draw
					svg.selectAll(".green-dot")
						.data(scope.ese1.simulationsResult)
					.enter().append("circle")
						.attr("class", "dot green-dot")
						.attr("r", dotRadius)
						.attr("cx", function(d){
							if(scope.axisType != "ordinal"){
								return xScale(d.end); //Return position of end date
							}else{
								return xScale(scope.ese1.strategy.name) + ((Math.random() * width/20) - width/40);
							}
						})
						.attr("cy", function(d){return yScale(d.annCompoundingRate * 100);})
						.style("fill", function(d) { return '#00FF00'});
					
					svg.selectAll(".red-dot")
						.data(scope.ese2.simulationsResult)
						.enter().append("circle")
						.attr("class", "dot red-dot")
						.attr("r", dotRadius)
						.attr("cx", function(d){
							if(scope.axisType != "ordinal"){
								return xScale(d.end); //Return position of end date
							}else{
								return xScale(scope.ese2.strategy.name) + ((Math.random() * width/20) - width/40);
							}
						})
						.attr("cy", function(d){return yScale(d.annCompoundingRate * 100);})
						.style("fill", function(d) { return '#FF0000'});
					
					//Legend if by date
					
					// draw legend
					if(scope.axisType != "ordinal"){
						var legendData=[
						{name:scope.ese1.strategy.name, color:"#00FF00"},
						{name:scope.ese2.strategy.name, color:"#FF0000"}
						]
						var legend = svg.selectAll(".legend")
							.data(legendData)
							.enter().append("g")
							.attr("class", "legend")
							.attr("transform", function(d, i) { return "translate(0," + i * 20 + ")"; });
						
						// draw legend colored rectangles
						legend.append("rect")
							.attr("x", width - 18)
							.attr("width", 18)
							.attr("height", 18)
							.style("fill", function(d) { return d.color;})
							.style("opacity", 0.5);
						
						// draw legend text
						legend.append("text")
							.attr("x", width - 24)
							.attr("y", 9)
							.attr("dy", ".35em")
							.style("text-anchor", "end")
							.text(function(d) { return d.name;})
					}
				}
			});
		}
	};
}]);