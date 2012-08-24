/*global */
/*jslint node: true */
(function () {
	"use strict";
	
	var http = require("http"),
		urlUtil = require("url"),
		io = require("../../routes/io-util.js"),
		download = function (url, callback, errorHandler) {
			
			var options = urlUtil.parse(url),
				content = [],
				req = http.request(options, function (res) {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						res.setEncoding('utf8');
						res.on('data', function (chunk) {
							content.push(chunk);
						});
						res.on('end', function () {
							callback(content.join(""));
						});
					} else {
						errorHandler({
							status: res.statusCode,
							message: "Unsupported http status code: " + res.statusCode
						});
					}
				});

			req.on('error', errorHandler);

			req.write('data\n');
			req.write('data\n');
			req.end();
		},
		storeResource = function (url, targetPath, errorHandler) {
			download(url, function (content) {
				io.writeFile(targetPath, content, function () {}, errorHandler);
			}, errorHandler);
		};

	/*storeResource("http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js", "/Users/marcbaechinger/test.js", function(err) {
		console.log("error", err.message);
	});*/
	exports.download = download;
	exports.storeResource = storeResource;
}());