/*global */
/*jslint node: true */
(function () {
	"use strict";
	
	var http = require("http"),
		https = require("https"),
		urlUtil = require("url"),
		io = require("../../routes/io-util.js"),
		download = function (url, callback, errorHandler) {
			
			var scheme = http;
			
			if (url.match(/^https:\/\//)) {
				scheme = https;
			} else if (!url.match(/^http:\/\//)) {
				errorHandler({
					status: 1001,
					message: "currently only http:// supported"
				});
				return;
			}
			
			var options = urlUtil.parse(url),
				content = [],
				req = scheme.request(options, function (res) {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						res.setEncoding('utf8');
						res.on('data', function (chunk) {
							content.push(chunk);
						});
						res.on('end', function () {
							callback(content.join(""));
						});
					} else if(res.statusCode === 301) {
						download(res.headers.location, callback, errorHandler);
					} else {
						errorHandler({
							status: res.statusCode,
							message: "Server sends unsupported http status code: " + res.statusCode
						});
					}
				});

			req.on('error', errorHandler);

			req.write('data\n');
			req.write('data\n');
			req.end();
		},
		storeResource = function (url, targetPath, callback, errorHandler) {
			download(url, function (content) {
				io.writeFile(targetPath, content, function () {
					if (callback) {
						callback(content);
					}
				}, errorHandler);
			}, errorHandler);
		};

	/*storeResource("http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js", "/Users/marcbaechinger/test.js", function(err) {
		console.log("error", err.message);
	});*/
	exports.download = download;
	exports.storeResource = storeResource;
}());