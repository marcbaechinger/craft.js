/*jslint node: true */
(function () {	
	exports.server = {
		port: 3000
	};
	exports.context = {
		src: "repo",
		dist: "dist",
		jobs: "jobs",
		default: "repo"
	};
	exports.path = {
		base: __dirname,
		src: __dirname + "/resources",
		dist: __dirname + "/dist",
		jobs: __dirname + "/jobs",
		views: __dirname + "/views",
		docroot: __dirname + '/public'
	};	
}());
