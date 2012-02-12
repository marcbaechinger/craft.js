/*jslint node: true */
(function () {
	"use strict";
	
	var concat = require("../app/dependency.js"),
		common = require("./common.js"),
		appConfig = require("../app-config.js"),
		fs = require("fs"),
		basePath = appConfig.path.src,
		translateDependencies = function (dependencies) {
			return dependencies.map(function (dep) {
				return dep.replace(basePath, "");
			});
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
		
	
	exports.storeJob = function (base) {
		return function (req, res, next) {
			var filename = req.body.name + ".cjs",
				path = base + "/" + filename;
			
			// TODO create generic sanitizing function for paths
			// sanitize user input	
			if (filename.indexOf("/") > 0) {
				filename = filename.substring(filename.lastIndexOf("/") + 1);
			}
			
			fs.writeFile(path, 
				JSON.stringify(req.body, null, 4), "utf8", 
				function (err) {
					res.processingStatus = "OK";
					if (err) {
						res.processingStatus = "ERR";
						res.processingError = err;
					}
					res.processingData = res.processingData || {};
					res.processingData.path = filename;
					next();
				});
		};
	};
	
	
	exports.createJobInfoFactory = function (base) {
		return function (req, res, next) {
			req.data.job = req.body;
			if (req.body.jobfile) {
				fs.readFile(appConfig.path.jobs + req.body.jobfile, function (error, data) {
					if (error) {
						error.statusCode = 404;
						common.sendErrorPage(req, res, error, true);
					} else {
						try {
							req.data.job = JSON.parse(data.toString());
							req.query.expand = "true";
							
							req.data.path = req.data.job.name + "_" + getTimeStamp() + ".js";
							req.data.realPath = req.data.base + "/" + req.data.path;
							req.data.fileName = req.data.path.substring(req.data.path.lastIndexOf("/") + 1);
							req.data.job.expand = true;
							next();
						} catch (e) {
							e.statusCode = 401;
							common.sendErrorPage(req, res, e, true);
						}
					}
				});
			} else {
				req.data.path = req.data.job.name + "_" + getTimeStamp() + ".js";
				req.data.realPath = req.data.base + "/" + req.data.path;
				req.data.fileName = req.data.path.substring(req.data.path.lastIndexOf("/") + 1);
				req.data.job.expand = true;
				next();
			}
		};
	};
	
	exports.resolve = function (req, res, next) {
		var files = req.data.job.files,
			file, deps = [];
			
		for (file in files) {
			if (files.hasOwnProperty(file)) {
				deps.push(concat.resolve(basePath + "/" + file));
			}
		}
		req.data.realPathDependencies = concat.joinDependencies.apply(undefined, deps);
		req.data.dependencies = translateDependencies(req.data.realPathDependencies);
		next();
	};
	
	
	exports.writeSourceCode = function (req, res, next) {
		var buffer = new Buffer(req.data.sourceCode, "utf-8"),
			dispatchError = function (e) {
				common.logError(e);
				common.sendErrorPage(req, res, e);
			};
			
		// TODO use write file instead
		fs.open(req.data.realPath, "w", function (err, fd) {
			if (err) {
				dispatchError(err);
			} else {
				fs.write(fd, buffer, 0, buffer.length, null, function (err) {
					fs.close(fd, function (err) {
						if (err) {
							dispatchError(err);
						} else {
							next();
						}
					});
					if (err) {
						dispatchError(err);
					}
				});
			}
		});
	};
	exports.sendBuildOutput = function (req, res) {
		res.send(JSON.stringify({ 
			ok: true,
			job: req.body,
			dependencies: req.data.dependencies,
			path: req.data.path
		}));
	};
	
	exports.renderBuildInfo = function (req, res) {
		res.send(JSON.stringify(req.body));
	};
}());