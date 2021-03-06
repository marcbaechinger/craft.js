/*jslint node: true */
/*global process: false */
(function () {
	"use strict";
	
	var fs = require("fs"),
		path = require("path"),
		io = require("./io-util.js"),
		errorPage = require("./error-page.js"),
		test = require("./test.js"),
		appConfig = require("../app-config.js"),
		fsmgmt = require("./fs-management.js"),
		logger = require("../app/logger.js").logger,
		plainFileContentTypes = {
			"html": "text/html;charset=utf-8",
			"webapp": "application/x-web-app-manifest+json;charset=utf-8",
			"jade": "text/plain;charset=utf-8",
			"css": "text/css;charset=utf-8",
			"txt": "text/plain;charset=utf-8",
			"json": "application/json;charset=utf-8",
			"suite": "application/json;charset=utf-8",
			"appcache": "text/cache-manifest"
		},
		binaryFileContentTypes = {
			"jpg": "image/jpeg",
			"jpeg": "image/jpeg",
			"gif": "image/gif",
			"png": "image/png"
		},
		templatedFileTemplates = {
			"qunit": "qunit/qunit",
			"app": "app/app",
		},
		getPostfix = function (fileName) {
			return fileName.substring(fileName.lastIndexOf(".") + 1);
		},
		evaluateBooleanProperty = function (primary, secondary, name) {
			var trueOrFalse = false;
			if (typeof primary[name] !== "undefined") {
				if (primary[name] === true || primary[name] === "true") {
					trueOrFalse = true;
				} else {
					trueOrFalse = false;
				}
			} else if (secondary[name] !== "undefined") {
				if (secondary[name] === true || secondary[name] === "true") {
					trueOrFalse = true;
				} else {
					trueOrFalse = false;
				}
			}
			return trueOrFalse;
		},
		pad = function (val) {
			if (val < 10) {
				return "0" + val;
			}
			return "" + val;
		},
		getTimeStamp = function () {
			var d = new Date(),
				buf = [];

			buf.push(d.getYear() + 1900 + pad(d.getMonth() + 1) + pad(d.getDate()));
			buf.push(pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + "_" + pad(d.getMilliseconds()));

			return buf.join("-");
		};
	
	/**
	 * normalizes user input which can be the extra path information,
	 * query string or a json object send in the request body
	 **/
	exports.createInputNormalizer = function (displayMode, context, baseProvider) {
		return function(req, res, next) {
			var path = req.params[0] || "",
				fileName = path.substring(path.lastIndexOf("/") + 1),
				postFix = getPostfix(fileName),
				file;
			
			if (!path && req.body.name) {
				path = req.body.name + "_" + getTimeStamp() + ".js";
			}
			
			path = path.replace(/^\/*/, "");
			path = path.replace(/ *\/$/, "");
			
			logger.debug("serving file at: " , path);
			
			req.body.transformation = req.body.transformation || {};
			
			req.data = {
				displayMode: displayMode,
				context: context,
				config: appConfig,
				base: baseProvider(),
				path: path,
				postfix: postFix,
				isBinary: typeof binaryFileContentTypes[postFix] !== "undefined",
				fileName: fileName,
				realPath: baseProvider() + "/" + path,
				sourceCode: "// no source code to view for '" + fileName + "'",
				job: {
					expand: evaluateBooleanProperty(req.query, req.body, "expand"),
					transformation: {
						mangle: evaluateBooleanProperty(req.query, req.body.transformation, "mangle"),
						squeeze: evaluateBooleanProperty(req.query, req.body.transformation, "squeeze"),
						minimize: evaluateBooleanProperty(req.query, req.body.transformation, "minimize"),
						beautify: evaluateBooleanProperty(req.query, req.body.transformation, "beautify")
					},
					validate: {
						lint: evaluateBooleanProperty(req.query, req.body, "lint"),
						options: {
							maxerr: 100,
							indent: 4
						}
					}
				}
			};
			next();
		};
	};
	
	
	exports.createFileDescriptor = function (req, res, next) {
		fs.stat(req.data.realPath, function(error, stats) {
			if (error) {
				error.statusCode = 404;
				errorPage.sendErrorPage(req, res, error);
			} else {
				req.data.fileDescriptor = stats;
				next();
			}
		});
	};
	
	exports.createBreadcrumpTokens = function (req, res, next) {
		var paths = {},
			tokens, currentPath = "",
			path = req.data.path;
			
		if (req.data.fileDescriptor.isFile()) {
			path = path.substring(0, path.lastIndexOf("/"));
		}
			
		if (path.indexOf("/") > -1) {
			tokens = path.split("/");
			tokens.forEach(function (token, idx) {
				currentPath += token + "/";
				paths[token] = currentPath.substring(0, currentPath.lastIndexOf("/"));
			});
		} else if (path){
			paths[path] = path;
		}
		
		req.data.breadcrumb = paths;
		next();
	};
	
	exports.directoryInterceptor = function (req, res, next) {
		if (req.data.fileDescriptor.isDirectory()) {
			req.data.sourceTree = fsmgmt.createSourceTree(req.data.base, req.data.path);
			res.render('directory-viewer', req.data);
		} else {
			next();
		}
	};
	
	
	exports.plainFileInterceptor = function (req, res, next) {
		var postfix = getPostfix(req.data.fileName);
		req.data.postfix = postfix;
		if (plainFileContentTypes[postfix] && req.query.viewer !== "true") {
			req.data.plain = true;
			exports.fileViewer(req, res);
		} else if (plainFileContentTypes[postfix]) {
			req.data.displayMode = postfix;
			next();
		} else {
			next();
		}
	};
	
	exports.binaryFileInterceptor = function (req, res, next) {
		var postfix = getPostfix(req.data.fileName);
		if (req.data.isBinary === true) {
			res.header("Content-Type", binaryFileContentTypes[postfix]);
			res.send(req.data.binaryData);
		} else {
			next();
		}
	};
	
	// TODO rename to templatedFileInterceptor
	exports.qunitInterceptor = function (req, res, next) {
		var postfix = getPostfix(req.data.fileName);
		req.data.postfix = postfix;
		if (postfix === "qunit" && req.query.phantom === "true") {
			test.runPhantomWithQuint(req, res, next);
		} else if (templatedFileTemplates[postfix] && req.query.viewer !== "true") {
			req.data.templated = true;
			exports.fileViewer(req, res);
		} else if (templatedFileTemplates[postfix]) {
			req.data.displayMode = "templated";
			next();
		} else {
			next();
		}
	};
	
	exports.getFileContent = function (req, res, next) {
		var sourceCode;
		try {
			if (req.data.fileDescriptor.isFile()) {
				fs.readFile(req.data.realPath, function(error, data) {
					if (error) {
						error.statusCode = 404;
						errorPage.sendErrorPage(req, res, error);
					} else {
						if (req.data.isBinary === true) {
							req.data.binaryData = data;
						} else {
							req.data.sourceCode = data.toString();
						}
						next();
					}
				});
			} else if (req.data.fileDescriptor.isDirectory()) {
				req.data.sourceTree = fsmgmt.createSourceTree(req.data.base, req.data.path);
				next();
			}
		} catch (e) {
		    e.statusCode = e.statusCode || 404;
		    errorPage.sendErrorPage(req, res, e);
		}
	};
	
	exports.deleteFile = function (req, res, next) {
		console.log("delete file", req.data.realPath);
		if (req.data.realPath.indexOf(req.data.base) !== 0) {
			console.error("access denied while deletion", req.data.realPath, req.data.base);
			req.data.status = "access-denied";
			next();
		} else {
			fs.unlink(req.data.realPath, function (e) {
				if (e) {
					res.processingStatus = "access-denied";
				} else {
					res.processingStatus = "OK";
				}
				next();
			});
		}
	};
	
	exports.sendProcessingStatus = function (req, res) {
		res.send(JSON.stringify({ 
			ok: res.processingStatus,
			error: res.processingError,
			data: res.processingData
		}));
	};	
	
	exports.sendDeletionConfirmation = function (req, res) {
		res.send(JSON.stringify({ 
			ok: res.processingStatus,
			error: res.processingError,
			path: req.data.path,
			status: res.processingStatus 
		}));
	};
	
	exports.fileViewer = function (req, res) {
		if (req.query.jsviewer) {
			req.data.lines = req.data.sourceCode.split("\n");
			res.render('source-viewer', req.data);
		} else if (req.data.postfix === "js") {
			res.header("Content-Type", "text/javascript;charset=utf-8");
			req.data.displayMode = "plain";
			res.render('source/plain', req.data);
		} else if (req.data.plain) {
			res.header("Content-Type", plainFileContentTypes[req.data.postfix]);
			req.data.displayMode = "plain";
			res.render('source/html', req.data);
		} else if (req.data.templated) {	
			req.data.displayMode = "templated";
			res.render(templatedFileTemplates[req.data.postfix], req.data);
		} else {
			req.data.lines = req.data.sourceCode.split("\n");
			res.render('source-viewer', req.data);
		}
	};
	
	exports.logError = function (error) {
		console.log("ERROR", JSON.stringify(error));
	};
}());