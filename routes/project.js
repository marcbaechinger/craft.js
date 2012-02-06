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
		pad = function(val) {
			if (val < 10) {
				return "0" + val;
			}
			return val + "";
		},
		getTimeStamp = function() {
			var d = new Date(),
				buf = [];
			
			buf.push(d.getYear() + 1900 + pad(d.getMonth() + 1) + pad(d.getDate()));
			buf.push(pad(d.getHours()) + pad(d.getMinutes()) + pad(d.getSeconds()) + "_" + pad(d.getMilliseconds()));

			return buf.join("-");
		};
	
	exports.createBuildInfoFactory = function(base) {
		return function(req, res, next) {
			req.data.build = true;
			req.data.path = req.body.projectName + "_" + getTimeStamp() + ".js";
			req.data.realPath = base + "/" + req.data.path;
			req.build = {
				files: req.body.files,
				name: req.body.projectName,
				expand: req.query.expand === "true",
				lint: req.query.lint === "true",
				transformation: {
					mangle: req.query.mangle === "true",
					squeeze: req.query.squeeze === "true",
					minimize: req.query.minimize === "true",
					beautify: req.query.beautify === "true"
				}
			};
			
			req.query.expand = "true";
			next();
		};
	};
	
	exports.resolve = function(req, res, next) {
		var files = req.body.files,
			file, deps = [];
		if (files) {
			for (file in files) {
				deps.push(concat.resolve(basePath + "/" + file));
			}
			req.data.realPathDependencies = concat.joinDependencies.apply(undefined, deps);
			req.data.dependencies = translateDependencies(req.data.realPathDependencies);
		}
		next();
	};
	
	exports.createUnlinker = function (base) {
		return function(req, res, next) {
			console.log("delete release", req.data.realPath);
			if (req.data.realPath.indexOf(base) !== 0) {
				console.error("access denied while deletion", req.data.realPath, base);
				req.data.status = "access-denied";
				next();
			} else {
				fs.unlink(req.data.realPath, function(e) {
					if (e) {
						req.data.status = "access-denied";
					} else {
						req.data.status = "OK";
					}
					next();
				});
			}
		};
	};
	exports.createSourceCodeWriter = function (base) {
		return function(req, res, next) {
			var buffer = new Buffer(req.data.sourceCode, "utf-8"),
				dispatchError = function(e) {
					common.logError(e);
					common.sendErrorPage(req, res, e);
				};
				
			// TODO use write file instead
			fs.open(req.data.realPath, "w", function(err, fd) {
				if (err) {
					dispatchError(err);
				} else {
					fs.write(fd, buffer, 0, buffer.length, null, function (err, written) {
						fs.close(fd, function(err) {
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
	};
	exports.sendBuildOutput = function (req, res) {
		res.send(JSON.stringify({ 
			ok: true,
			project: req.body,
			dependencies: req.data.dependencies,
			path: req.data.path
		}));
	};
	
	exports.renderBuildInfo = function (req, res) {
		res.send(JSON.stringify(req.build));
	};
	exports.sendDeletionConfirmation = function(req, res) {
		res.send(JSON.stringify({ 
			"@action": "delete-release",
			path: req.data.path,
			status: req.data.status 
		}));
	};
}());