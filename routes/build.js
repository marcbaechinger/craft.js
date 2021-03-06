/*global require: false, console: false, exports: false, process: false */
(function () {
	"use strict";

	var common = require("./common.js"),
		errorPage = require("./error-page.js"),
		concat = require("../app/dependency.js"),
		appConfig = require("../app-config.js"),
		uglify = require("../app/uglify.js"),
		jshint = require('../app/jshint.js'),
		basePathProvider = function () { return appConfig.path.src; },
		concatenator = new concat.Concatenator({
			basePathProvider: basePathProvider
		}),
		getAst = function (req) {
			var data = req.data;
			if (!data.ast) {
				data.ast = uglify.parseCode(data.sourceCode, false);
			}
			return data.ast;
		},
		translateDependencies = function (dependencies) {
			var basePath = basePathProvider();
			return dependencies.map(function (dep) {
				// TODO use substring to crop basepath 
				return dep.replace(basePath, "");
			});
		};

	concat.allowAbsoluteDependencies(true);
	
	exports.resolve = function (req, res, next) {
		try {
			req.data.realPathDependencies = concatenator.resolve(req.data.realPath);
			req.data.dependencies = translateDependencies(req.data.realPathDependencies);
			next();
		} catch (e) {
			errorPage.sendErrorPage(req, res, {
				type: "resolve-failed",
				path: req.data.realPath,
				statusCode: 400,
				error: e
			});
			throw e;
		}
	};
	exports.expand = function (req, res, next) {
		var sourceCode;
		if (req.data.job.expand === true) {
			sourceCode = concatenator.concatenateFiles(req.data.realPathDependencies);
			req.data.sourceCode = sourceCode;
		}
		next();
	};
	exports.mangle = function (req, res, next) {
		if (req.data.job.transformation.mangle === true) {
			req.data.ast = uglify.mangle(getAst(req), {});
		}
		next();
	};
	exports.squeeze = function (req, res, next) {
		if (req.data.job.transformation.squeeze === true) {
			req.data.ast = uglify.squeeze(getAst(req), {});
		}
		next();
	};
	exports.astToSourceCode = function (req, res, next) {
		var options = {}, sourceCode;
		if (req.data.job.transformation.mangle ||
				req.data.job.transformation.squeeze ||
				req.data.job.transformation.beautify ||
				req.data.job.transformation.minimize) {

			req.data.job.transformation.minimize = true;
			
			if (req.data.job.transformation.beautify === true) {
				options.beautify = true;
				req.data.job.transformation.minimize = false;
			}
			sourceCode = uglify.generate(getAst(req), options);
			req.data.sourceCode = sourceCode;
		}

		next();
	};
	exports.extractLintOptions = function (req, res, next) {
		var options = req.data.job.validate.options,
			name,
			val;
		for (name in req.query) {
			if (req.query.hasOwnProperty(name)) {
				if (name.match(/^lint-/)) {
					val = req.query[name];
					if (val === "false") {
						val = false;
					} else if (val === "true") {
						val = true;
					} else {
						try {
							val = parseInt(val, 10);
						} catch (e) {
							/* ignored */
						}
					}
					options[name.replace(/^lint-/, "")] = val;
				}
			}
		}
		next();
	};
	exports.lint = function (req, res, next) {
		if (req.data.job.validate.lint === true) {
			req.data.report = jshint.processJSHint(req.data.sourceCode, req.data.job.validate.options);
		}
		next();
	};

}());