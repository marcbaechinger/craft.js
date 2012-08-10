/*jslint node: true */
/*global process: false */
(function () {
	"use strict";
	
	var fs = require("fs"),
		path = require("path"),
		test = require("./test.js"),
		appConfig = require("../app-config.js"),
		fsmgmt = require("./fs-management.js"),
		logger = require("../app/logger.js").logger,
		plainFileContentTypes = {
			"html": "text/html",
			"css": "text/css",
			"json": "application/json",
			"suite": "application/json"
		},
		binaryFileContentTypes = {
			"jpg": "image/jpeg",
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
		},
		writeFile = function (filepath, content, callback, errorHandler) {
			console.log(filepath);
			var buffer = new Buffer(content, "utf-8");
			fs.open(filepath, "w", function (err, fd) {
				if (err && errorHandler) {
					errorHandler(err);
					return;
				}
				fs.write(fd, buffer, 0, buffer.length, null, function (err) {
					fs.close(fd, function (err) {
						if (!err && callback) { 
							callback(); 
						}
					});
					if (err) {
						errorHandler(err);
					}
				});
			});
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
				path = (req.body.name || "release") + "_" + getTimeStamp() + ".js";
			}
			
			path = path.replace(/^\/*/, "");
			path = path.replace(/ *\/$/, "");
			
			logger.info("serving file at: " , path);
			
			req.body.transformation = req.body.transformation || {};
			
			req.data = {
				displayMode: displayMode,
				context: context,
				config: appConfig,
				base: baseProvider(),
				path: path,
				isBinary: typeof binaryFileContentTypes[postFix] !== "undefined",
				fileName: fileName,
				realPath: baseProvider() + "/" + path,
				sourceCode: "// no source code to view",
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
				exports.sendErrorPage(req, res, error);
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
						exports.sendErrorPage(req, res, error);
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
		    exports.sendErrorPage(req, res, e);
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
		if (req.query.plain) {
			res.header("Content-Type", "text/javascript");
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
	
	exports.sendErrorPage = function (req, res, err, isJSON) {
		res.statusCode = err.statusCode || 500;
		exports.logError(err);
		if (isJSON === true) {
			res.send(JSON.stringify(err));	
		} else {
			if (err.error) {
				err.message = err.error.message;
			} else {
				err.message = err.message;
			}
			req.data.displayMode = "error";
			req.data.error = err;
			req.data.rootCause = err.error;
			req.data.errorString = JSON.stringify(err, null, 4);
			res.render('error', req.data);	
		}
	};
	
	exports.updateConfiguration = function (req, res) {
		var configFilePath = path.join(__dirname, "../app-config.json");
		fs.readFile(configFilePath, function(error, data) {
			var configuration;
			if (error) {
				error.statusCode = 404;
				exports.sendErrorPage(req, res, error);
			} else {
				configuration =  JSON.parse(data);
				configuration.path.src = req.body.path;
				
				writeFile(configFilePath, JSON.stringify(configuration, null, 4), function() {
					res.send(JSON.stringify({ 
						status: "ok",
						configuration: configuration
					}));
					appConfig.path.src = configuration.path.src;		
				},
				function (err) {
					error.statusCode = 403;
					exports.sendErrorPage(req, res, error);
				});
			}
		});
	};
	
	exports.sendConfigPage = function (req, res) {
		res.statusCode = 200;
		res.header("Content-Type", "text/html");
		res.render('config', {
			displayMode: "config",
			context: "config",
			config: {
				context: {
					src: "repo",
					dist: "dist",
					jobs: "jobs"
				}
			}
		});
	};
}());