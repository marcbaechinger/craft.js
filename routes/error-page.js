/*global */
/*jslint node: true */

var logError = function (error) {
	console.log("ERROR", JSON.stringify(error));
};

exports.sendErrorPage = function (req, res, err, isJSON) {
	res.statusCode = err.statusCode || 500;
	logError(err);
	if (isJSON === true) {
		res.send(JSON.stringify(err));
	} else {
		if (err.error) {
			err.message = err.error.message;
		}
		req.data.displayMode = "error";
		req.data.error = err;
		req.data.rootCause = err.error;
		req.data.errorString = JSON.stringify(err, null, 4);
		res.render('error', req.data);
	}
};