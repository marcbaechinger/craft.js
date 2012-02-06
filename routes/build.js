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
	
	exports.createFileInfoFactory = function(base) {
		return function (req, res, next) {
			var path = req.params[0].replace(/^\/*/, "");
			path = path.replace(/ *\/$/, "");
			req.data.path = path;
			req.data.realPath = base + "/" + path;
			fs.stat(base + "/" + path, function(error, stats) {
				if (error) {
					error.statusCode = 404;
					common.sendErrorPage(req, res, error);
				} else {
					req.data.fileDescriptor = stats;
					next();
				}
			});
		};
	};
	exports.createBreadcrumpTokens = function (req, res, next) {
		var paths = {},
			tokens, currentPath = "",
			path = req.data.path;
			
		if (path.lastIndexOf("/") > -1) {
			tokens = path.substring(0, path.lastIndexOf("/")).split("/")
			tokens.forEach(function (token) {
				currentPath += token + "/";
				paths[token] = currentPath.substring(0, currentPath.lastIndexOf("/"));
			});
			req.data.breadcrumb = paths;	
		}
		next();
	};
	exports.getFileContent = function (base) {
		return function (req, res, next) {
			var sourceCode;
			try {
				if (req.data.fileDescriptor.isFile()) {
					fs.readFile(req.data.realPath, function(error, data) {
						if (error) {
							error.statusCode = 404;
							common.sendErrorPage(req, res, error);
						} else {
							req.data.sourceCode = data.toString();
							next();
						}
					});
				} else if (req.data.fileDescriptor.isDirectory()) {
					req.data.sourceTree = fsmgmt.createSourceTree(base, req.data.path);
					next();
				}
			} catch (e) {
			    e.statusCode = e.statusCode || 404;
			    common.sendErrorPage(req, res, e);
			}
			
		};
	};
	exports.resolve = function (req, res, next) {
		if (req.data.fileDescriptor.isFile() && req.data.realPath) {
			try {
				req.data.realPathDependencies = concatenator.resolve(req.data.realPath);
				req.data.dependencies = translateDependencies(req.data.realPathDependencies);
			} catch (e) {
				common.sendErrorPage(req, res, {
					type: "resolve-failed",
					path: req.data.realPath,
					statusCode: 400,
					error: e
				});
			}
		}
		next();
	};
	exports.expand = function (req, res, next) {
		var sourceCode;
		if (req.query.expand === "true") {
			sourceCode = concatenator.concatenateFiles(req.data.realPathDependencies);
			req.data.sourceCode = sourceCode;
			req.data.expanded = true;
		} else {
			req.data.expanded = false;
		}
		next();
	};
	exports.mangle = function (req, res, next) {
		if (req.query.mangle === "true") {
			req.data.ast = uglify.mangle(getAst(req), {});
			req.data.mangled = true;
		} else {
			req.data.mangled = false;
		}
		next();
	};
	exports.squeeze = function (req, res, next) {
		if (req.query.squeeze === "true") {
			req.data.ast = uglify.squeeze(getAst(req), {});
			req.data.squeezed = true;
		} else {
			req.data.squeezed = false;
		}
		next();
	};
	exports.astToSourceCode = function (req, res, next) {
		var options = {}, sourceCode;
		req.data.beautified = false;
		if (req.query.beautify) {
			req.query.minimize = "false";
		}
		if (req.data.ast || req.query.minimize) {
			if (req.query.minimize !== "true") {
				options.beautify = true;
				req.data.beautified = true;
			}
			sourceCode = uglify.generate(getAst(req), options);
			req.data.sourceCode = sourceCode;
			req.data.minimized = true;
		} else {
			req.data.minimized = false;
		}
		next();
	};
	exports.extractLintOptions = function (req, res, next) {
		var name, options = {}, val;
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
		req.data.lintOptions = options;
		next();
	};
	exports.lint = function (req, res, next) {
		if (req.query.lint === "true") {
			if (req.data.path.match(/\.js$/)) {
				req.data.report = jshint.processJSHint(req.data.sourceCode, req.data.lintOptions);
			}
			req.data.linted = true;
		} else {
			req.data.linted = false;
		}
		next();
	};
	exports.fileViewer = function(displayMode) {
		return function (req, res) {
			req.data.displayMode = displayMode;
			if (req.query.plain) {
				res.header("Content-Type", "text/javascript");
				res.render('source/plain', req.data);
			} else {
				if (req.data.sourceCode) {
					req.data.lines = req.data.sourceCode.split("\n");
				}
				req.data.context = displayMode === "src" ? appConfig.context.src : appConfig.context.dist;
				req.data.dist = appConfig.context.dist;
				req.data.src = appConfig.context.src;
				req.data.title = req.data.path;
				res.render('file-viewer', req.data);
			}
		}
	};
	
}());