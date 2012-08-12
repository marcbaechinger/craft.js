/*global */
/*jslint node: true */
var fs = require("fs"),
	logger = require("../app/logger.js").logger;
	
exports.writeFile = function (filepath, content, callback, errorHandler) {
	var buffer = new Buffer(content, "utf-8");
	
	logger.info( "io-utils.writeFile(): " + filepath);
	
	fs.open(filepath, "w", function (err, fd) {
		if (err && errorHandler) {
			errorHandler(err);
			return;
		}
		fs.write(fd, buffer, 0, buffer.length, null, function (err) {
			fs.close(fd, function (err) {
				if (!err && callback) {
					callback();
				}
			});
			if (err) {
				errorHandler(err);
			}
		});
	});
};