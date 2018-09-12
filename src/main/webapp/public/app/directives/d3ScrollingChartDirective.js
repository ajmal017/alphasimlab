angular.module("ALApp")
.directive("scrollChart", function (){
	return {
		restrict: 'E', //Element only
		replace: false, //don't overwrite our directive declaration
		scope: {
		},
		link: function (scope, element, attrs) {
			var trendDirection = (Math.random() * 4) + 4; //4-8
			var tradeChance = 0.05;
			var n = 200, data = [20], holdingPeriods=[];
			var makeData = function(){
				var next = d3.random.normal(data[data.length-1], 5)() + trendDirection;
				if(next > 80){
					trendDirection = (Math.random() / 2) * -1;
				}else if( next < 20){
					trendDirection = (Math.random() / 2)
				}
				next = (next > 90)?next-(Math.random() * 7+5):next;
				next = (next < 10)?next+(Math.random() * 7+5):next;
				return next;
			};
			var calcHoldingPeriods = function(){
				holdingPeriods.forEach(function(p, idx){
					p.val -= 1;
				});
				if(Math.random() < 0.05){
					holdingPeriods.push({val:200});
				}
				if(holdingPeriods.length >= 2 && holdingPeriods[1].val < 0){
					holdingPeriods.shift();
					holdingPeriods.shift();
				}
			}
			for(var i=1; i<n; i++){
				data.push(makeData());
				calcHoldingPeriods();
			}

			var margin = {top: 0, right: 0, bottom: 20, left: 0}, //{top: 0, right: 50, bottom: 30, left: 50},
				width = element[0].parentElement.clientWidth - margin.left - margin.right,
				height = (parseInt(d3.select(element[0].parentElement).style('width'), 10) / 3) - margin.top - margin.bottom,
				navHeight = (width / 15) - margin.top - margin.bottom;

			//Remove old plot
			d3.select(element[0]).selectAll("*").remove();
			//Define the plot width and height
			var x = d3.scale.linear()
				.domain([0, n - 1])
				.range([0, width]);
			var y = d3.scale.linear()
				.domain([0, 100])
				.range([height, 0]);
			var area = d3.svg.area()
			    .x(function(d, i) { return x(i); })
			    .y0(height)
			    .y1(function(d, i) { return y(d); });
			var svg = d3.select(element[0]).append("svg")
			    .attr("width", width + margin.left + margin.right)
			    .attr("height", height + margin.top + margin.bottom)
			  .append("g")
			    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
			
			svg.append("g")
				.attr("class", "x axis")
				.attr("transform", "translate(0," + y(0) + ")")
				.call(d3.svg.axis().scale(x).orient("bottom").tickFormat(""));
			svg.append("g")
				.attr("class", "y axis")
				.call(d3.svg.axis().scale(y).orient("left"));
			
			var path = svg.append("g")
				.attr("clip-path", "url(#clip)")
				.append("path")
				.datum(data)
				.attr("class", "area")
				.attr("d", area);

			svg.append("rect")
				.attr("x", 0)
				.attr("y", 0)
				.attr("width", width)
				.attr("height", height)
				.attr('class', 'plot-shroud');
			
			tick();
			function tick() {
				// push a new data point onto the back
				data.push(makeData());
				// holding period
				calcHoldingPeriods();
				// redraw the line, and slide it to the left
				path.attr("d", area)
					.attr("transform", null)
					.transition()
					.duration(300)
					.ease("linear")
					.attr("transform", "translate(" + x(-1) + ",0)")
					.each("end", tick);
				
				// pop the old data point off the front
				data.shift();
			}
		}
	};
});