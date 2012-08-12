/*global require: false, module: false, __dirname: false, console: false */
/**
 * Module dependencies.
 */
(function () {
	"use strict";

	var appConfig = require("./app-config"),
		express = require('express'),
		build = require('./routes/build.js'),
		test = require('./routes/test.js'),
		common = require('./routes/common.js'),
		config = require('./routes/config.js'),
		jobs = require('./routes/jobs.js'),
		release = require('./routes/release.js'),
		util = require('./app/util'),
		app = module.exports = express.createServer(),
		repositoryDirectoryProvider = function() { 
			return appConfig.path.src; 
		},
		jobsDirectoryProvider = function() { 
			return appConfig.path.jobs; 
		},
		distDirectoryProvider = function() { 
			return appConfig.path.dist; 
		};

	// Configuration
	app.configure(function () {
		app.set('views', appConfig.path.views);
		app.set('view engine', 'jade');
		app.set('view options', { layout: false, pretty: false });
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.compiler({ src: appConfig.path.docroot, enable: ['less'] }));
		app.use(app.router);
		app.use(express.static(appConfig.path.docroot));
	});

	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});
	app.configure('production', function () {
		app.use(express.errorHandler());
	});
	
	util.mkdir(appConfig.path.src);
	util.mkdir(appConfig.path.dist);
	util.mkdir(appConfig.path.jobs);
	
	// Routes
	app.get('/', function (req, res) {
		res.render('index', { 
			title: 'craft.js - a javascript crafting tool', 
			src: appConfig.context.src, 
			displayMode: "js",
			context: "src",
			config: { context: { src: "repo", dist: "dist", jobs: "jobs" } }
		});
	});
	
	app.get("/" + appConfig.context.src + "/*",
			common.createInputNormalizer("js", appConfig.context.src, repositoryDirectoryProvider),
			common.createFileDescriptor,
			common.createBreadcrumpTokens,
			common.directoryInterceptor,
			common.getFileContent,
			common.binaryFileInterceptor,
			common.qunitInterceptor,
			common.plainFileInterceptor,
			build.resolve,
			build.expand,
			build.mangle,
			build.squeeze,
			build.astToSourceCode,
			build.extractLintOptions,
			build.lint,
			common.fileViewer
		);

	app.get("/" + appConfig.context.dist + "/*",
			common.createInputNormalizer("js", appConfig.context.dist, distDirectoryProvider),
			common.createFileDescriptor,
			common.directoryInterceptor,
			common.getFileContent,
			common.binaryFileInterceptor,
			build.mangle,
			build.squeeze,
			build.astToSourceCode,
			build.extractLintOptions,
			build.lint,
			common.fileViewer
		);
		
	app.delete("/" + appConfig.context.dist + "/*",
			common.createInputNormalizer("dist", appConfig.context.dist, distDirectoryProvider),
			common.createFileDescriptor,
			common.deleteFile,
			common.sendDeletionConfirmation
		);
	
	app.get("/" + appConfig.context.jobs + "/*",
			common.createInputNormalizer("job", appConfig.context.jobs, jobsDirectoryProvider),
			common.createFileDescriptor,
			common.directoryInterceptor,
			common.getFileContent,
			common.fileViewer
		);

	app.put("/" + appConfig.context.jobs,
			jobs.storeJob(jobsDirectoryProvider),
			common.sendProcessingStatus
	);
	
	app.delete("/" + appConfig.context.jobs + "/*",
			common.createInputNormalizer("job", appConfig.context.jobs, jobsDirectoryProvider),
			common.createFileDescriptor,
			common.deleteFile,
			common.sendDeletionConfirmation
		);
		
	app.post("/release",
		common.createInputNormalizer("dist", appConfig.context.dist, distDirectoryProvider),
		jobs.createJobInfoFactory(distDirectoryProvider),
		jobs.resolve,
		build.expand,
		build.mangle,
		build.squeeze,
		build.astToSourceCode,
		jobs.writeSourceCode,
		release.sendReleaseOutput
	);
	
	config.init(app, "/config");
	
	
	app.listen(appConfig.server.port);
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());
