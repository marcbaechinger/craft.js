(function () {
	"use strict";
	
	var concat = require("../app/dependency.js"),
		common = require("./common.js"),
		appConfig = require("../app-config.js"),
		fs = require("fs");
	
	exports.storeJob = function (base) {
		return function (req, res, next) {
			fs.writeFile(base + "/" + req.build.name + ".cjs", 
				JSON.stringify(req.build, null, 4), "utf8", 
				function(err) {
					req.build.status = "OK";
					if (err) {
						req.build.status = "ERR";
						req.build.error = err;
					}
					next();
				});
		};
	};
}());