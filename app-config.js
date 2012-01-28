/*gloabl exports: true */
(function () {
	var fs = require("fs");
	
	exports.server = {
		port: 3000
	};
	exports.path = {
		src: __dirname + "/stuff",
		dist: __dirname + "/stuffdist",
		views: __dirname + "/views",
		docroot: __dirname + '/public'
	};
	
}());