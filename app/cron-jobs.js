/*global */
/*jslint node: true */
(function () {
	"use strict";

	var DEFAULTS = {
			timezone: "Europe/Amsterdam"
		},
		appConfig = require("../app-config.js"),
		cron = require("cron"),
		logger = require("./logger.js").logger;           
		
	exports.init = function init() {
		var cronJob;
		Object.keys(appConfig.cronJobs).forEach(function (name) {
			cronJob = appConfig.cronJobs[name];
			logger.info("cron-jobs.js::loadJobs(): register '" + name + "' jobs '" + cronJob.pattern + "'");
			new cron.CronJob(cronJob.pattern, function () {
				cronJob.jobs.forEach(function (pathToJob) {
					logger.debug(name + ": ", pathToJob);
				});
			}, null, true, DEFAULTS.timezone);
		});
		return exports;
	};
}());