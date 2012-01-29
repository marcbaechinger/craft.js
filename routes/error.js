/*global require: false, console: false, exports: false, process: false */
(function () {
	"use strict";
	
	exports.sendErrorPage = function (req, res, err) {
		res.statusCode = err.statusCode || 500;
		res.render('error', {
			error: err,
			errorString: JSON.stringify(err, null, 4)
		});
	};
	
	exports.logError = function (error) {
		console.log("ERROR", JSON.stringify(error));
	};
}());