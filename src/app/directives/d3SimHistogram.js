angular.module("ALApp")
.directive("simHistogram", ['$window', function ($window){
	return {
		restrict: 'E', //Element only
		replace: false, //don't overwrite our directive declaration
		scope: {
			data: '=histogramData', //Array of simulationsResult object
			renderStatus: '=renderWatch' //variable that gets updated when simulation finishes
		},
		link: function (scope, element, attrs) {
			var margin = {top: 10, right: 10, bottom: 40, left: 20}
			  , width = parseInt(d3.select(element[0].parentElement).style('width'), 10) - 15
			  , width = width - margin.left - margin.right;
			var height = (parseInt(d3.select(element[0].parentElement).style('width'), 10) / 2)
			var binsize = 500;
		    var minbin = 0;
		    var maxbin = 12000;
		    var binmargin = .1;

			scope.$watch("renderStatus",function(newValue,oldValue) { //data
				if (scope.data) {
				//Remove old plot
				d3.select(element[0]).selectAll("*").remove();

				// Set the limits of the x axis
				var xmin = minbin - 1
				var xmax = maxbin + (1 * binsize)
				var numbins = Math.ceil((maxbin - minbin) / binsize);
				
				//Initialize a data structure with histogram tallies
				var bindata = [];
			    for (var i = 0; i < numbins; i++) {
			    	bindata.push({val:0, html:""});
				}
				
				//Iterate over data and bin-ify histogram tallies
			    scope.data.forEach(function(d, idx){
					var bin = Math.floor((d.endingMoney - minbin) / binsize);
					if ((bin.toString() != "NaN") && (bin < bindata.length)) {
						bindata[bin].val++;
						bindata[bin].html += "<tr><td>" + (d.start.getMonth()+1) + "/" + d.start.getFullYear() + " to " + (d.end.getMonth()+1) + "/" + d.end.getFullYear() + " </td></tr>";
					}
				});
				
				// This scale is for determining the widths of the histogram bars
			    // Must start at 0 or else x(binsize a.k.a dx) will be negative
				var x = d3.scale.linear()
					.domain([0, (xmax - xmin)])
					.range([0, width]);

				// Scale for the placement of the bars
				var x2 = d3.scale.linear()
					.domain([xmin, xmax])
					.range([0, width]);
				
				var y = d3.scale.linear()
					.domain([0, d3.max(bindata, function(d) { 
						return d.val; 
					})])
					.range([height, 0]);
				//Setup the axis using the scales
				var xAxis = d3.svg.axis()
					.scale(x2)
					.tickFormat( function(d) {
						var lbl = "";
						if(d < 1000000){
							return "$" + Math.floor(d/1000)+"k"
						}else{
							return "$" + Math.floor(d/1000000)+"MM"
						}
					})
					.orient("bottom");
				var yAxis = d3.svg.axis()
					.scale(y)
					.orient("left");
				//Setup mouseover tooltip
				//d3.select('body').selectAll(".histogram-tip").remove();
				var tip = d3.tip()
					.attr('class', 'd3-tip histogram-tip')
					.offset([-10, 0])
					.html(function(d) {
						return '<table id="tiptable">' + d.html + "</table>";
				});
				
				//Create the histogram object
				var svg = d3.select(element[0]).append("svg")
				  .attr("width", width + margin.left + margin.right)
				  .attr("height", height + margin.top + margin.bottom)
				  .append("g")
				  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
				
				//Bind tooltip
				svg.call(tip);
				
				// set up the bars
				var bar = svg.selectAll(".bar")
					.data(bindata)
					.enter().append("g")
					.attr("class", "bar")
					.attr("transform", function(d, i) { 
						return "translate(" + x2(i * binsize + minbin) + "," + y(d.val) + ")"; 
					})
					.on('mouseover', tip.show)
					.on('mouseout', tip.hide);
				// add rectangles of correct size at correct location
				bar.append("rect")
					.attr("x", x(binmargin))
					.attr("width", x(binsize - 2 * binmargin))
					.attr("height", function(d) { return height - y(d.val); });
				
				// add the x axis and x-label
				svg.append("g")
					.attr("class", "x axis")
					.attr("transform", "translate(0," + height + ")")
					.call(xAxis);
				svg.append("text")
					.attr("class", "xlabel")
					.attr("text-anchor", "middle")
					.attr("x", width / 2)
					.attr("y", height + margin.bottom)
					.text("Terminal account value");
				
				//Add the mean center line
				var endingMoneyArr = scope.data.map(function(sim){return sim.endingMoney;});
				//var med = math.med(endingMoneyArr);
				//math.med seems to be broken only in IE
				var med = median(endingMoneyArr);
				
				svg.append("line")
					.attr("x1", x(med))
					.attr("x2", x(med))
					.attr("y1", 0)
					.attr("y2", height)
					.attr("stroke-dasharray","5,5")
					.attr("style","stroke:black;stroke-width:1;");
				//Label the mean center line
				svg.append("text")
					.text(function (d) { return "Average: $" + Math.round(med); })
					.attr("transform","translate(" + (x(med)-5) + ", 75) rotate(-90)");
				
				
				// add the y axis and y-label
				svg.append("g")
					.attr("class", "y axis")
					.attr("transform", "translate(0,0)")
					.call(yAxis);
				svg.append("text")
					.attr("class", "ylabel")
					.attr("y", 0)
					.attr("x", 0 - (height / 2) - margin.top - 5)
					.attr("dy", "1em")
					.attr("transform", "rotate(-90)")
					.style("text-anchor", "right")
					.text("# of simulations");
				}
			});
		}
	};
}]);