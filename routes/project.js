(function () {
	"use strict";
	
	var concat = require("../app/dependency.js"),
		fs = require("fs"),
		basePath = process.cwd() + "/stuff/",
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
			req.query.expand = "true";
			next();
		};
	};
	exports.resolve = function(req, res, next) {
		var files = req.body.files,
			file, deps = [];
		
		for (file in files) {
			console.log("resolve", basePath + file);
			deps.push(concat.resolve(basePath + file));
		}
		req.data.realPathDependencies = concat.joinDependencies.apply(undefined, deps);
		req.data.dependencies = translateDependencies(req.data.realPathDependencies);
		next();
	};
	exports.createSourceCodeWriter = function (base) {
		return function(req, res, next) {
			var buffer = new Buffer(req.data.sourceCode, "utf-8"),
				fd;
				
			try {
				fd = fs.openSync(req.data.realPath, "w");
				fs.writeSync(fd, buffer, 0, buffer.length, null);
			} catch (e) {
				console.log("error", e);
			} finally {
				fs.closeSync(fd);
			}
			next();
		};
	};
	exports.sendBuildOutput = function (req, res) {
		res.send(JSON.stringify({ 
			ok: true,
			project: req.body,
			dependencies: req.data.dependencies,
			path: req.data.path
		}));
		//res.render('project-build', {title: "Build project"});
	};
}());