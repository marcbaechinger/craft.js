/*jslint node: true */
(function () {	
	var fs = require("fs"),
		config = JSON.parse(fs.readFileSync('app-config.json'));
	
	exports.server = {
		port: config.server.port
	};
	exports.context = {
		src: config.context.src,
		dist: config.context.dist,
		jobs: config.context.jobs,
		default: config.context.default
	};
	exports.path = {
		base: __dirname,
		src: __dirname + "/" + config.path.src,
		dist: __dirname + "/" + config.path.dist,
		jobs: __dirname + "/" + config.path.jobs,
		views: __dirname + "/" + config.path.views,
		docroot: __dirname + "/" + config.path.docroot
	};
}());
