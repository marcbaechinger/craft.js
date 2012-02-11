/*global require: false, console: false, exports: false, process: false */
(function () {
	"use strict";

	var fs = require("fs"),
		common = require("./common.js"),
		concat = require("../app/dependency.js"),
		appConfig = require("../app-config.js"),
		uglify = require("../app/uglify.js"),
		jshint = require('../app/jshint.js'),
		fsmgmt = require('./fs-management.js'),
		basePath = appConfig.path.src,
		concatenator = new concat.Concatenator({
			basePath: basePath
		}),
		getAst = function (req) {
			var data = req.data;
			console.log("getAst", data.sourceCode);
			if (!data.ast) {
				data.ast = uglify.parseCode(data.sourceCode, false);
			}
			return data.ast;
		},
		translateDependencies = function (dependencies) {
			return dependencies.map(function (dep) {
				return dep.replace(basePath, "");
			});
		};
	
	exports.resolve = function (req, res, next) {
		try {
			req.data.realPathDependencies = concatenator.resolve(req.data.realPath);
			req.data.dependencies = translateDependencies(req.data.realPathDependencies);
			next();
		} catch (e) {
			common.sendErrorPage(req, res, {
				type: "resolve-failed",
				path: req.data.realPath,
				statusCode: 400,
				error: e
			});
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
			req.data.job.transformation.minimize ) {
				
			if (req.data.job.transformation.beautify === true) {
				options.beautify = true;
			}
			sourceCode = uglify.generate(getAst(req), options);
			req.data.sourceCode = sourceCode;
		}
		 
		next();
	};
	exports.extractLintOptions = function (req, res, next) {
		var options = req.data.job.validate.options, 
			name, val;
		for (name in req.query) {
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
		next();
	};
	exports.lint = function (req, res, next) {
		if (req.data.job.validate.lint === true) {
			req.data.report = jshint.processJSHint(req.data.sourceCode, req.data.job.validate.options);
		}
		next();
	};
	
}());