/*global require: false, exports: false, __dirname: false */
(function () {
	"use strict";
	
	var util = require("./util.js"),
		jshint = require('jshint'),
		DEFAULT_OPTIONS = {
			browser: true,
			devel: true,
			curly: true,
			eqeqeq: true,
			forin: true,
			immed: true,
			latedef: true,
			newcap: true,
			noarg: true,
			noempty: true,
			nonew: true,
			plusplus: true,
			regexp: true,
			undef: true,
			trailing: true,
			maxerr: 10000
		},
		createErrorReport = function (report, errors) {
			report.errors = errors;
			report.errorLines = {};
			util.each(errors, function () {
				if (this && this.evidence) {
					this.evidence = this.evidence.replace(/^\t*/, "");
					report.errorLines[this.line] = this.reason;
				}
			});
		},
		process = function (sourceCode, options) {
			var report = { status: "ok", statusMessage: "JSHint detected no code smells" };
				
			report.options = options || DEFAULT_OPTIONS;
			
			report.isClean = jshint.JSHINT(sourceCode, report.options, []);
			if (!report.isClean) {
				createErrorReport(report, jshint.JSHINT.errors);
				report.status = "error";
				report.statusMessage = "JSHint detected " + report.errors.length + " code smells";
			}
			return report;
		};
		
	exports.processJSHint = process;
}());
