angular.module("ALApp")
.directive('ads', function() {
	return {
		restrict: 'E', //Element only
		replace: false,
	    template: '<ins class="adsbygoogle"'+
			'style="display:block;"'+
			'data-ad-client="ca-pub-6865068809368860"'+
			'data-ad-slot="8312894837"'+
			'data-ad-format="auto"></ins>',
		controller: function(){
            (adsbygoogle = window.adsbygoogle || []).push({});
        }
    };
});