angular.module("ALApp")
.service("fileAjaxService", function($http, $q){
	var self = this;
//	this.listFiles = function(){
//		return $http({
//		    method: 'GET',
//		    url: "files"
//		});
//	};
	this.getFile = function(fileName){
		return $http({
		    method: 'GET',
		    url: "data/" + fileName
		});
	};
}); 