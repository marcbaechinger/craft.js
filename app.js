/*global require: false, module: false, __dirname: false, console: false */
/**
 * Module dependencies.
 */
(function () {
	"use strict";

	var express = require('express'),
		build = require('./routes/build.js'),
		project = require('./routes/project.js'),
		app = module.exports = express.createServer(),
		distDirectory = __dirname + "/stuffdist",
		srcDirectory = __dirname + "/stuff";

	// Configuration
	app.configure(function () {
		app.set('views', __dirname + '/views');
		app.set('view engine', 'jade');
		app.set('view options', { layout: false });
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(express.compiler({ src: __dirname + '/public', enable: ['less'] }));
		app.use(app.router);
		app.use(express.static(__dirname + '/public'));
	});

	
	app.configure('development', function () {
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
	});
	app.configure('production', function () {
		app.use(express.errorHandler());
	});

	// Routes
	app.get('/', function (req, res) {
		res.render('index', { title: 'quality-js' });
	});
	
	app.post("/project/build",
		build.setupRenderData,
		project.createBuildInfoFactory(distDirectory),
		project.resolve,
		build.expand,
		build.mangle,
		build.squeeze,
		build.astToSourceCode,
		project.createSourceCodeWriter(distDirectory),
		project.sendBuildOutput
	);
	
	app.get('/build/*',
		build.setupRenderData,
		build.createFileInfoFactory(srcDirectory),
		build.createBreadcrumpTokens,
		build.getFileContent(srcDirectory),
		build.resolve,
		build.expand,
		build.mangle,
		build.squeeze,
		build.astToSourceCode,
		build.lint,
		build.fileViewer("build")
	);
	
	app.get('/dist/*',
		build.setupRenderData,
		build.createFileInfoFactory(distDirectory),
		build.createBreadcrumpTokens,
		build.getFileContent(distDirectory),
		build.mangle,
		build.squeeze,
		build.astToSourceCode,
		build.lint,
		build.fileViewer("dist")
	);

	app.listen(3000);
	console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
}());