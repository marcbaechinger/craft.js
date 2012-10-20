/*global */
/*jslint node: true */
(function () {
	var phantom = require("../app/qunit-phantom.js"),
		fsUtil = require("./fs-management.js"),
		appConfig = require("../app-config.js");

	exports.runPhantomWithQuint = function (req, res) {

		(new phantom.QUnitPhantomJS({
			url: "http://localhost:" + req.data.config.server.port + "/" + req.data.context + "/" + req.data.path,
			callback: function (code, report) {
				report.exitCode = code;

				res.statusCode = 200;
				res.header("Content-Type", "application/json");
				res.send(JSON.stringify(report, null, 2));
			},
			error: function (err) {
				res.statusCode = 500;
				res.header("Content-Type", "application/json");
				res.send(JSON.stringify({
					statusCode: res.statusCode,
					exitCode: err.code,
					err: err
				}));
			}
		})).run();
	};

	var createFileSelector = function (pattern) {
		return function (req, res, next) {
			fsUtil.searchFiles(appConfig.path.src, pattern, function(err, files) {
				if (files) {
					res.send(JSON.stringify({
						files: files
					}));
				} else if (err) {
					res.statusCode = 500;
					res.header("Content-Type", "application/json");
					res.send(JSON.stringify({
						status: 500,
						exitCode: 500,
						message: err.message,
						err: err
					}));
				}
			});
		};
	};
	
	
	exports.init = function (app, contextPath) {
		app.get(contextPath, createFileSelector(/\.qunit$/));
		app.get(contextPath + "/javascripts", createFileSelector(/\.js$/));
	};
}());