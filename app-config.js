/*gloabl exports: true */
(function () {
	var fs = require("fs");
	
	exports.server = {
		port: 3000
	};
	exports.context = {
		src: "repo",
		dist: "dist"
	};
	exports.path = {
		src: __dirname + "/resources",
		dist: __dirname + "/dist",
		views: __dirname + "/views",
		docroot: __dirname + '/public'
	};
	
}());
