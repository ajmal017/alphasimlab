function median(values) {
	values.sort( function(a,b) {return a - b;} );
	var half = Math.floor(values.length/2);
	return values[Math.floor(half)];
}