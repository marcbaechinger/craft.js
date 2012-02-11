/*global require: false, module: false, __dirname: false, console: false */
/**
 * Module dependencies.
 */
(function () {
	"use strict";

	var appConfig = require("./app-config"),
		express = require('express'),
		build = require('./routes/build.js'),
		common = require('./routes/common.js'),
		jobs = require('./routes/jobs.js'),
		release = require('./routes/release.js'),
		util = require('./app/util'),
		app = module.exports = express.createServer(),

		jobsDirectory = appConfig.path.jobs,
		distDirectory = appConfig.path.dist,
		srcDirectory = appConfig.path.src;

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

	util.mkdir(appConfig.path.src);
	util.mkdir(appConfig.path.dist);

	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});
	app.configure('production', function () {
		app.use(express.errorHandler());
	});

	// Routes
	app.get('/', function (req, res) {
		res.render('index', { title: 'craft.js', src: appConfig.context.src });
	});
	
	app.get("/" + appConfig.context.src + "/*",
			common.createInputNormalizer("js", appConfig.context.src, srcDirectory),
			common.createFileDescriptor,
			common.createBreadcrumpTokens,
			common.directoryInterceptor,
			common.getFileContent,
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
			common.createInputNormalizer("js", appConfig.context.dist, distDirectory),
			common.createFileDescriptor,
			common.directoryInterceptor,
			common.getFileContent,
			build.mangle,
			build.squeeze,
			build.astToSourceCode,
			build.extractLintOptions,
			build.lint,
			common.fileViewer
		);

	
	app.get("/" + appConfig.context.jobs + "/*",
			common.createInputNormalizer("job", appConfig.context.jobs, jobsDirectory),
			common.createFileDescriptor,
			common.directoryInterceptor,
			common.getFileContent,
			common.fileViewer
		);

	app.put("/" + appConfig.context.jobs,
			jobs.storeJob(jobsDirectory),
			common.sendProcessingStatus
	);
	
	app.delete("/" + appConfig.context.jobs + "/*",
			common.createInputNormalizer("job", appConfig.context.jobs, jobsDirectory),
			common.createFileDescriptor,
			common.deleteFile,
			common.sendDeletionConfirmation
		);
	
	app.delete("/" + appConfig.context.dist + "/*",
			common.createInputNormalizer("dist", appConfig.context.dist, distDirectory),
			common.createFileDescriptor,
			common.deleteFile,
			common.sendDeletionConfirmation
		);
		
	// TODO rename path to 'release' 
	app.post("/release",
		common.createInputNormalizer("dist", appConfig.context.dist, distDirectory),
		jobs.createJobInfoFactory(distDirectory),
		
		jobs.resolve,
		build.expand,
		build.mangle,
		build.squeeze,
		build.astToSourceCode,
		jobs.writeSourceCode,
		release.sendReleaseOutput
	);
/*	app.post("/" + appConfig.context.jobs,
			jobs.createJobInfoFactory(distDirectory),
			common.normalizeUserInput,
			jobs.resolve,
			build.expand,
			build.mangle,
			build.squeeze,
			build.astToSourceCode,
			jobs.createSourceCodeWriter(distDirectory),
			jobs.sendBuildOutput
		);

*/		
	app.listen(appConfig.server.port);
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());