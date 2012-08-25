/*jslint node: true */
(function () {
	var config = JSON.parse(require("fs").readFileSync('app-config.json')),
		repositoryPath,
		gitHooks = {},
		cdnLibs = {};
	
	exports.server = {
		port: config.server.port
	};
	exports.useGit = config.useGit;
	exports.context = {
		src: config.context.src,
		dist: config.context.dist,
		jobs: config.context.jobs,
		default: config.context.default
	};
	
	if (!config.path.src.match(/^\//)) {
		repositoryPath = __dirname + "/" + config.path.src;
	} else {
		repositoryPath = config.path.src;
	}
	
	if (config.gitHooks) {
		gitHooks = config.gitHooks;
	}
	
	if (config.cdnLibs) {
		cdnLibs = config.cdnLibs;
	}
	
	exports.gitHooks = gitHooks;
	exports.cdnLibs = cdnLibs;
	exports.path = {
		base: __dirname,
		src: repositoryPath,
		dist: __dirname + "/" + config.path.dist,
		jobs: __dirname + "/" + config.path.jobs,
		views: __dirname + "/" + config.path.views,
		docroot: __dirname + "/" + config.path.docroot
	};
}());
