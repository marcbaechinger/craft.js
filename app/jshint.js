/*global require: false, exports: false, __dirname: false */
(function () {
	"use strict";
	
	var jshint = require('jshint'),
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
			errors.forEach(function (error) {
				if (error && error.evidence) {
					error.evidence = error.evidence.replace(/^\t*/, "");
					report.errorLines[error.line] = error.reason;
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
