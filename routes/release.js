/*jslint node: true */
(function () {
	"use strict";
	
	var appConfig = require("../app-config.js");
		
	exports.sendReleaseOutput = function (req, res) {
		res.send(JSON.stringify({ 
			ok: true,
			job: req.data.job,
			dependencies: req.data.dependencies,
			path: req.data.path
		}));
	};
	
	exports.renderReleaseInfo = function (req, res) {
		res.send(JSON.stringify(req.data.job));
	};
}());